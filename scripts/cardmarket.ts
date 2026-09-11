import type { FabPrinting } from "@fabkit/shared/data/fab-printings";

/**
 * Cardmarket prices, for the European half of the audience: a TCGplayer
 * dollar price is close to meaningless when deciding what a card is worth
 * to someone buying in euros.
 *
 * Cardmarket withdrew their API and now publish two files instead, both
 * public, both refreshed daily:
 *   productCatalog/productList/products_singles_16.json  what exists
 *   productCatalog/priceGuide/price_guide_16.json        what it costs
 * (16 is their category id for Flesh and Blood.)
 *
 * THE PROBLEM THIS FILE SOLVES. Neither file says which VERSION of a card
 * a product is. Cardmarket's website shows "Swordmaster's Path (Blue)
 * (Rainbow Foil)", but the string "Rainbow Foil" appears literally zero
 * times in the 3.2 MB product file, and their website answers automated
 * requests with a 403, so the labels cannot be read from either side. No
 * Flesh and Blood card dataset carries Cardmarket ids either, so there is
 * no ready-made bridge to cross.
 *
 * WHAT WE USE INSTEAD. Three facts in the data are enough:
 *
 *   1. `idMetacard` identifies a card, pitch colour included. Sink Below
 *      red, yellow and blue are three metacards, and all of a card's
 *      versions in one set share one (metacard, expansion) pair.
 *   2. Within that pair, Cardmarket adds products plainest-first, and
 *      `dateAdded` records it. A card's normal print is added seconds
 *      before its Rainbow Foil.
 *   3. So when Cardmarket's number of versions for a card equals OURS, the
 *      two lists pair off in order with nothing left over on either side,
 *      and the pairing is forced rather than guessed.
 *
 * Where the counts DISAGREE we write no price at all. That is the whole
 * accuracy story: not every card gets a price, but every price shown is
 * one the data forces. Roughly 93% of card versions pair unambiguously.
 *
 * Verified by hand against Cardmarket's own website (Mastery Pack Warrior,
 * seven cards, including the awkward ones): normal 4.31 against Rainbow
 * Foil 6.65 on Overwhelming Swing, where a swapped pairing would show. Two
 * of the seven turned out to have an Extended Art Rainbow Foil and no
 * ordinary one, and our own data independently flags exactly those two
 * with artVariations ["EA"], which is a second source agreeing.
 *
 * Keyed by `uniqueId`, NOT by TCGplayer product id like the tcgcsv
 * snapshot: GEM Packs 3, 4 and 5 carry no TCGplayer ids at all, and they
 * are among the sets Cardmarket helps most (95%, 92% and 100% covered,
 * against 1, 0 and 0 priced cards from TCGplayer).
 */

const CM_BASE = "https://downloads.s3.cardmarket.com/productCatalog";
const PRODUCTS_URL = `${CM_BASE}/productList/products_singles_16.json`;
const PRICES_URL = `${CM_BASE}/priceGuide/price_guide_16.json`;

interface CmProduct {
	idProduct: number;
	name: string;
	idExpansion: number;
	idMetacard: number;
	dateAdded: string;
}

interface CmPriceRow {
	idProduct: number;
	avg: number | null;
	trend: number | null;
}

export interface CardmarketSnapshot {
	capturedAt: string;
	/** Cardmarket's own createdAt, so a price is never presented as more
	 * current than the file it came from. */
	sourceUpdatedAt: string;
	currency: "EUR";
	/** Keyed by FabPrinting.uniqueId. A missing key means "no price we can
	 * prove", never zero. */
	cardPrices: Record<string, number>;
}

export interface CardmarketCoverage {
	/** Cardmarket expansion this set resolved to, 0 when none did. */
	expansion: number;
	/** Distinct card versions in our own data. */
	versions: number;
	/** Versions we wrote a price for. */
	priced: number;
	/** Versions dropped because their version count disagreed with ours. */
	ambiguous: number;
	/** Median Cardmarket/TCGplayer ratio, as a sanity signal. Null when the
	 * set has too few TCGplayer prices to compare against. */
	ratio: number | null;
}

/** A card, pitch colour included — the unit Cardmarket's idMetacard also
 * identifies. Pitch is part of the name on Cardmarket only when it needs
 * to tell two printings apart, so a bare-name fallback is always tried. */
const PITCH_SUFFIX = /\s*\((Red|Yellow|Blue|Yelllow|Bleu)\)\s*$/;
const PITCH_LABEL: Record<number, string> = {
	1: "Red",
	2: "Yellow",
	3: "Blue",
};

/** Plainest first, which is the order Cardmarket adds products in. A Marvel
 * is its own product there rather than a foiling of an existing one, so it
 * sorts last regardless of the Cold Foil it is printed in. */
const TREATMENT_ORDER: Record<string, number> = {
	standard: 0,
	rainbow: 1,
	cold: 2,
	"gold-cold": 3,
	marvel: 9,
};

function cardKey(name: string, pitch: number | null): string {
	return `${name}|${pitch ? (PITCH_LABEL[pitch] ?? "") : ""}`;
}

function normalisePitch(raw: string): string {
	// Cardmarket's own data carries a handful of typos: "(Yelllow)" on four
	// products and "(Bleu)" on one.
	if (raw === "Yelllow") return "Yellow";
	if (raw === "Bleu") return "Blue";
	return raw;
}

export interface CardmarketCatalog {
	sourceUpdatedAt: string;
	/** card key -> the metacards it could be (more than one only where
	 * Cardmarket splits a name we don't). */
	metacardsByCard: Map<string, Set<number>>;
	/** "metacard|expansion" -> that card's products in that set, oldest
	 * first, which is plainest first. */
	productsByCardInSet: Map<string, CmProduct[]>;
	/** metacard -> the expansions it appears in, for resolving which
	 * Cardmarket set one of ours is. */
	expansionsByMetacard: Map<number, number[]>;
	priceByProduct: Map<number, number>;
}

export async function fetchCardmarketCatalog(): Promise<CardmarketCatalog> {
	const [productFile, priceFile] = await Promise.all([
		fetch(PRODUCTS_URL).then((r) => {
			if (!r.ok) throw new Error(`Cardmarket products fetch: ${r.status}`);
			return r.json() as Promise<{ createdAt: string; products: CmProduct[] }>;
		}),
		fetch(PRICES_URL).then((r) => {
			if (!r.ok) throw new Error(`Cardmarket prices fetch: ${r.status}`);
			return r.json() as Promise<{ priceGuides: CmPriceRow[] }>;
		}),
	]);

	const metacardsByCard = new Map<string, Set<number>>();
	const productsByCardInSet = new Map<string, CmProduct[]>();
	const expansionsByMetacard = new Map<number, number[]>();

	for (const product of productFile.products) {
		const match = product.name.match(PITCH_SUFFIX);
		const pitch = match ? normalisePitch(match[1]) : "";
		const key = `${product.name.replace(PITCH_SUFFIX, "")}|${pitch}`;
		let metacards = metacardsByCard.get(key);
		if (!metacards) {
			metacards = new Set();
			metacardsByCard.set(key, metacards);
		}
		metacards.add(product.idMetacard);

		const inSet = `${product.idMetacard}|${product.idExpansion}`;
		const list = productsByCardInSet.get(inSet);
		if (list) list.push(product);
		else productsByCardInSet.set(inSet, [product]);

		const expansions = expansionsByMetacard.get(product.idMetacard);
		if (expansions) {
			if (!expansions.includes(product.idExpansion)) {
				expansions.push(product.idExpansion);
			}
		} else {
			expansionsByMetacard.set(product.idMetacard, [product.idExpansion]);
		}
	}

	for (const list of productsByCardInSet.values()) {
		list.sort(
			(a, b) =>
				a.dateAdded.localeCompare(b.dateAdded) || a.idProduct - b.idProduct,
		);
	}

	const priceByProduct = new Map<number, number>();
	for (const row of priceFile.priceGuides) {
		// `trend` is what Cardmarket shows as the headline figure; `avg` is
		// the fallback for a product too thinly traded to have a trend.
		const value = row.trend ?? row.avg;
		if (value !== null && value !== undefined && value > 0) {
			priceByProduct.set(row.idProduct, value);
		}
	}

	return {
		sourceUpdatedAt: productFile.createdAt,
		metacardsByCard,
		productsByCardInSet,
		expansionsByMetacard,
		priceByProduct,
	};
}

interface Version {
	treatment: string;
	printings: FabPrinting[];
}

/** Our printings as Cardmarket would count them: one entry per distinct
 * version of a card, plainest first. Several of our printings can share a
 * version (a card with more than one art variation of the same foiling). */
function versionsOf(printings: FabPrinting[]): Map<string, Version[]> {
	const byCard = new Map<string, Map<string, FabPrinting[]>>();
	for (const printing of printings) {
		const key = cardKey(printing.name, printing.pitch);
		let versions = byCard.get(key);
		if (!versions) {
			versions = new Map();
			byCard.set(key, versions);
		}
		const treatment =
			printing.rarity === "marvel" ? "marvel" : printing.foiling;
		const list = versions.get(treatment);
		if (list) list.push(printing);
		else versions.set(treatment, [printing]);
	}

	const out = new Map<string, Version[]>();
	for (const [key, versions] of byCard) {
		out.set(
			key,
			[...versions.entries()]
				.map(([treatment, list]) => ({ treatment, printings: list }))
				.sort(
					(a, b) =>
						(TREATMENT_ORDER[a.treatment] ?? 8) -
						(TREATMENT_ORDER[b.treatment] ?? 8),
				),
		);
	}
	return out;
}

function metacardsFor(
	catalog: CardmarketCatalog,
	key: string,
): Set<number> | undefined {
	return (
		catalog.metacardsByCard.get(key) ??
		// Cardmarket brackets the pitch colour only where it needs to tell
		// two printings apart, so a card that exists in one colour only is
		// listed under its bare name. Without this fallback roughly half of
		// a modern set reads as "not on Cardmarket" when it is all there.
		catalog.metacardsByCard.get(`${key.split("|")[0]}|`)
	);
}

function productsIn(
	catalog: CardmarketCatalog,
	key: string,
	expansion: number,
): CmProduct[] {
	const metacards = metacardsFor(catalog, key);
	if (!metacards) return [];
	const out: CmProduct[] = [];
	for (const metacard of metacards) {
		const list = catalog.productsByCardInSet.get(`${metacard}|${expansion}`);
		if (list) out.push(...list);
	}
	return out.sort(
		(a, b) =>
			a.dateAdded.localeCompare(b.dateAdded) || a.idProduct - b.idProduct,
	);
}

/** A sane euro-per-dollar figure to score candidate expansions against.
 * Not an exchange rate: the two markets genuinely diverge, and this only
 * has to separate "the same cards" from "the same cards at three times the
 * price", which is what the 1st Edition listings look like. */
const EXPECTED_EUR_PER_USD = 0.9;

/** Which Cardmarket expansion is this set?
 *
 * Voting on metacards finds the candidates, but for Welcome to Rathe,
 * Arcane Rising and Crucible of War it finds TWO with identical contents
 * and identical product counts: 1st Edition and Unlimited. Nothing in the
 * files distinguishes them, so the tie is broken on price. Our TCGplayer
 * prices are Unlimited (preferring the print still sold in boosters — see
 * buildSetPriceSnapshot's EDITION_PREFIXES), so the candidate whose prices
 * agree with those IS the Unlimited one. Welcome to Rathe scored 3.16
 * euros per dollar before this and 1.03 after. */
function chooseExpansion(
	catalog: CardmarketCatalog,
	versions: Map<string, Version[]>,
	tcgPrices: Record<string, number>,
): { expansion: number; ratio: number | null } {
	const votes = new Map<number, number>();
	for (const key of versions.keys()) {
		const metacards = metacardsFor(catalog, key);
		if (!metacards) continue;
		for (const metacard of metacards) {
			for (const expansion of catalog.expansionsByMetacard.get(metacard) ??
				[]) {
				votes.set(expansion, (votes.get(expansion) ?? 0) + 1);
			}
		}
	}
	const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
	if (ranked.length === 0) return { expansion: 0, ratio: null };

	const best = ranked[0][1];
	let winner: { expansion: number; ratio: number; score: number } | null = null;
	for (const [expansion, count] of ranked) {
		// Only candidates that hold nearly the whole set. A promo expansion
		// sharing a few reprints must never win on price agreement alone.
		if (count < best * 0.8) continue;
		const ratios: number[] = [];
		for (const [key, ours] of versions) {
			const products = productsIn(catalog, key, expansion);
			if (products.length !== ours.length) continue;
			for (let i = 0; i < ours.length; i++) {
				const euros = catalog.priceByProduct.get(products[i].idProduct);
				const printing = ours[i].printings[0];
				const dollars = printing.tcgplayerProductId
					? tcgPrices[`${printing.tcgplayerProductId}:${printing.foiling}`]
					: undefined;
				// Cheap cards are noise in both markets; a 20 cent card says
				// nothing about whether this is the right expansion.
				if (euros && dollars && euros > 0.5 && dollars > 0.5) {
					ratios.push(euros / dollars);
				}
			}
		}
		if (ratios.length < 10) continue;
		ratios.sort((a, b) => a - b);
		const median = ratios[Math.floor(ratios.length / 2)];
		const score = Math.abs(Math.log(median / EXPECTED_EUR_PER_USD));
		if (!winner || score < winner.score) {
			winner = { expansion, ratio: median, score };
		}
	}

	// No candidate had enough comparable prices to score (a set TCGplayer
	// barely prices, e.g. the newer GEM Packs). Fall back to the most-voted
	// one, which is unambiguous whenever there is only one candidate.
	if (!winner) return { expansion: ranked[0][0], ratio: null };
	return { expansion: winner.expansion, ratio: winner.ratio };
}

export function buildCardmarketSnapshot(
	printings: FabPrinting[],
	tcgPrices: Record<string, number>,
	catalog: CardmarketCatalog,
): { snapshot: CardmarketSnapshot; coverage: CardmarketCoverage } {
	const versions = versionsOf(printings);
	const { expansion, ratio } = chooseExpansion(catalog, versions, tcgPrices);

	const cardPrices: Record<string, number> = {};
	let versionCount = 0;
	let priced = 0;
	let ambiguous = 0;

	for (const [key, ours] of versions) {
		versionCount += ours.length;
		const products = expansion ? productsIn(catalog, key, expansion) : [];
		// The forced pairing, and the only one we accept: same number of
		// versions on both sides means each of ours has exactly one of
		// theirs, in order. Anything else is a guess, so it gets no price.
		if (products.length !== ours.length || products.length === 0) {
			ambiguous += ours.length;
			continue;
		}
		for (let i = 0; i < ours.length; i++) {
			const euros = catalog.priceByProduct.get(products[i].idProduct);
			if (euros === undefined) continue;
			priced++;
			// Every printing sharing this version gets the same price: they
			// are one product as far as Cardmarket is concerned.
			for (const printing of ours[i].printings) {
				cardPrices[printing.uniqueId] = euros;
			}
		}
	}

	return {
		snapshot: {
			capturedAt: new Date().toISOString(),
			sourceUpdatedAt: catalog.sourceUpdatedAt,
			currency: "EUR",
			cardPrices,
		},
		coverage: {
			expansion,
			versions: versionCount,
			priced,
			ambiguous,
			ratio,
		},
	};
}
