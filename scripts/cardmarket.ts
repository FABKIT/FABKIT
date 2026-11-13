import { priceKey } from "@fabkit/shared/data/fab-prices";
import type { SetCardmarketSnapshot } from "@fabkit/shared/data/fab-prices-cm";
import type { FabPrinting } from "@fabkit/shared/data/fab-printings";

/**
 * Cardmarket euro prices from their public daily flat files. Products carry
 * no version label, so they are matched to our printings by count:
 *
 *   1. `idMetacard` identifies a card; a card's versions in one set share a
 *      (metacard, expansion) pair.
 *   2. A card is priced only when Cardmarket's version count equals ours under
 *      one of four readings of "a version" (foiling, + art variation,
 *      + collector number, + both), plainest first.
 *   3. Within a collector number the cheapest product is taken as the plainest
 *      version, so version-to-price pairing is a heuristic.
 *
 * Keyed by `uniqueId` because the GEM Packs have no TCGplayer ids.
 */

const CM_BASE = "https://downloads.s3.cardmarket.com/productCatalog";
const PRODUCTS_URL = `${CM_BASE}/productList/products_singles_16.json`;
const SEALED_URL = `${CM_BASE}/productList/products_nonsingles_16.json`;
const PRICES_URL = `${CM_BASE}/priceGuide/price_guide_16.json`;

interface CmProduct {
	idProduct: number;
	name: string;
	idExpansion: number;
	idMetacard: number;
	dateAdded: string;
	/** Nonsingles only. */
	categoryName?: string;
}

interface CmPriceRow {
	idProduct: number;
	avg: number | null;
	trend: number | null;
}

interface CardmarketCoverage {
	/** Cardmarket expansion this set resolved to, 0 when none did. */
	expansion: number;
	/** Distinct card versions in our own data. */
	versions: number;
	/** Versions we wrote a price for. */
	priced: number;
	/** Versions dropped: count disagreed under every reading (see header). */
	ambiguous: number;
	/** Versions that needed a reading finer than "one per foiling" to pair. */
	refinedPairings: number;
	/** The print run compared against, or null when the set has only one
	 * (see editionForExpansion). */
	edition: string | null;
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

/** Reduces a card name to one spelling across both catalogues: drops
 * apostrophes, stray whitespace and the second face of a double-faced card
 * ("A // B"), and lowercases. */
function normaliseName(name: string): string {
	return name
		.split("//")[0]
		.replace(/[’']/g, "")
		.trim()
		.replace(/\s+/g, " ")
		.toLowerCase();
}

function cardKey(name: string, pitch: number | null): string {
	return `${normaliseName(name)}|${pitch ? (PITCH_LABEL[pitch] ?? "") : ""}`;
}

function normalisePitch(raw: string): string {
	// Typos in Cardmarket's data.
	if (raw === "Yelllow") return "Yellow";
	if (raw === "Bleu") return "Blue";
	return raw;
}

export interface CardmarketCatalog {
	sourceUpdatedAt: string;
	/** card key -> the metacards it could be (more than one only where
	 * Cardmarket splits a name we don't). */
	metacardsByCard: Map<string, Set<number>>;
	/** "metacard|expansion" -> that card's products in that set, in file
	 * order. productsIn puts them in the order they pair in. */
	productsByCardInSet: Map<string, CmProduct[]>;
	/** metacard -> the expansions it appears in, for resolving which
	 * Cardmarket set one of ours is. */
	expansionsByMetacard: Map<number, number[]>;
	/** expansion -> sealed products filed under it (same expansion ids as cards). */
	sealedByExpansion: Map<number, CmProduct[]>;
	priceByProduct: Map<number, number>;
}

export async function fetchCardmarketCatalog(): Promise<CardmarketCatalog> {
	const [productFile, sealedFile, priceFile] = await Promise.all([
		fetch(PRODUCTS_URL).then((r) => r.json()) as Promise<{
			createdAt: string;
			products: CmProduct[];
		}>,
		fetch(SEALED_URL).then((r) => r.json()) as Promise<{
			products: CmProduct[];
		}>,
		fetch(PRICES_URL).then((r) => r.json()) as Promise<{
			priceGuides: CmPriceRow[];
		}>,
	]);

	const metacardsByCard = new Map<string, Set<number>>();
	const productsByCardInSet = new Map<string, CmProduct[]>();
	const expansionsByMetacard = new Map<number, number[]>();

	for (const product of productFile.products) {
		const match = product.name.match(PITCH_SUFFIX);
		const pitch = match ? normalisePitch(match[1]) : "";
		const key = `${normaliseName(product.name.replace(PITCH_SUFFIX, ""))}|${pitch}`;
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

	const sealedByExpansion = new Map<number, CmProduct[]>();
	for (const product of sealedFile.products) {
		const list = sealedByExpansion.get(product.idExpansion);
		if (list) list.push(product);
		else sealedByExpansion.set(product.idExpansion, [product]);
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
		sealedByExpansion,
		priceByProduct,
	};
}

/** Sealed products that are not the pack this simulator opens (Japanese,
 * First Edition, Golden Booster, Treasure Pack and so on). A set with no
 * match gets no euro pack price rather than a wrong one. */
const SEALED_EXCLUSIONS =
	/japanese|case|display|blitz|golden|treasure|world premiere|bundle|first edition|1st edition|alpha/i;

/** The GEM Packs share one Cardmarket expansion and are told apart by the
 * number at the end of their names, which our set codes also carry. */
const GEM_CODE = /^GEM(\d)$/;

/** A set's sealed euro prices, from the expansion its cards resolved to.
 * Null where there is no single matching listing or it has no price. */
function resolveSealedPrices(
	catalog: CardmarketCatalog,
	expansion: number,
	setCode: string,
): { packPrice: number | null; boxPrice: number | null } {
	const products = catalog.sealedByExpansion.get(expansion) ?? [];
	const gem = setCode.match(GEM_CODE);

	function pick(category: string): number | null {
		let candidates = products.filter(
			(product) =>
				product.categoryName === category &&
				!SEALED_EXCLUSIONS.test(product.name),
		);
		if (gem) {
			candidates = candidates.filter((product) =>
				product.name.trim().endsWith(gem[1]),
			);
		}
		// Several survivors means the exclusions are stale; don't guess.
		if (candidates.length !== 1) return null;
		return catalog.priceByProduct.get(candidates[0].idProduct) ?? null;
	}

	return {
		packPrice: pick("Flesh And Blood Booster"),
		boxPrice: pick("Flesh And Blood Booster Boxes"),
	};
}

interface Version {
	/** Empty unless this reading splits by collector number. */
	cardId: string;
	treatment: string;
	/** Empty unless this reading splits by art variation. */
	artVariation: string;
	printings: FabPrinting[];
}

/** One card's versions under each reading, plainest first. */
type CardReadings = Version[][];

/** Collector number, then plainest foiling, then ordinary art before Extended Art. */
function sortVersions(versions: Version[]): Version[] {
	return versions.sort(
		(a, b) =>
			a.cardId.localeCompare(b.cardId) ||
			(TREATMENT_ORDER[a.treatment] ?? 8) -
				(TREATMENT_ORDER[b.treatment] ?? 8) ||
			a.artVariation.localeCompare(b.artVariation),
	);
}

/** The four readings of one card's printings, plainest first. */
function readingsFor(printings: FabPrinting[]): CardReadings {
	const group = (splitCard: boolean, splitArt: boolean): Version[] => {
		const buckets = new Map<string, Version>();
		for (const printing of printings) {
			const treatment =
				printing.rarity === "marvel" ? "marvel" : printing.foiling;
			const cardId = splitCard ? printing.id : "";
			const artVariation = splitArt
				? [...printing.artVariations].sort().join(",")
				: "";
			const key = `${cardId}|${treatment}|${artVariation}`;
			const bucket = buckets.get(key);
			if (bucket) bucket.printings.push(printing);
			else
				buckets.set(key, {
					cardId,
					treatment,
					artVariation,
					printings: [printing],
				});
		}
		return sortVersions([...buckets.values()]);
	};

	return [
		group(false, false),
		group(false, true),
		group(true, false),
		group(true, true),
	];
}

/** Our printings as Cardmarket might count them, keyed by card. When
 * `edition` is set only that print run is considered, falling back to all
 * printings for a card with none in it. */
function versionsOf(
	printings: FabPrinting[],
	edition: string | null,
): Map<string, CardReadings> {
	const byCard = new Map<string, FabPrinting[]>();
	for (const printing of printings) {
		const key = cardKey(printing.name, printing.pitch);
		const list = byCard.get(key);
		if (list) list.push(printing);
		else byCard.set(key, [printing]);
	}

	const out = new Map<string, CardReadings>();
	for (const [key, all] of byCard) {
		const inEdition = edition
			? all.filter((printing) => printing.edition === edition)
			: all;
		out.set(key, readingsFor(inEdition.length > 0 ? inEdition : all));
	}
	return out;
}

/** The print run of a Cardmarket expansion, read from the name of its
 * booster. Null for single-run sets, where every printing is compared. */
function editionForExpansion(
	catalog: CardmarketCatalog,
	expansion: number,
): string | null {
	const names = (catalog.sealedByExpansion.get(expansion) ?? [])
		.map((product) => product.name.toLowerCase())
		.join(" ");
	if (names.includes("unlimited")) return "U";
	if (names.includes("alpha")) return "A";
	if (names.includes("first")) return "F";
	return null;
}

function metacardsFor(
	catalog: CardmarketCatalog,
	key: string,
): Set<number> | undefined {
	return (
		catalog.metacardsByCard.get(key) ??
		// Pitch is bracketed only where needed, so fall back to the bare name.
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

/**
 * dateAdded groups products by collector number but does not reliably order
 * them by foiling, so prices are handed out in ascending order within each
 * collector-number chunk: cheapest to our plainest treatment. A chunk with
 * an unpriced product gets no prices, since there is no telling which
 * version that product is. */
function pricesByVersion(
	ours: readonly Version[],
	products: readonly CmProduct[],
	priceByProduct: ReadonlyMap<number, number>,
): Array<number | undefined> {
	const prices: Array<number | undefined> = new Array(ours.length).fill(
		undefined,
	);
	let start = 0;
	while (start < ours.length) {
		let end = start + 1;
		while (end < ours.length && ours[end].cardId === ours[start].cardId) {
			end++;
		}
		const chunk = products
			.slice(start, end)
			.map((product) => priceByProduct.get(product.idProduct));
		if (!chunk.includes(undefined)) {
			(chunk as number[])
				.sort((a, b) => a - b)
				.forEach((price, i) => {
					prices[start + i] = price;
				});
		}
		start = end;
	}
	return prices;
}

/** Rough euro-per-dollar figure to score candidate expansions against; not
 * an exchange rate. */
const EXPECTED_EUR_PER_USD = 0.9;

/** Which Cardmarket expansion is this set? Metacard votes find the
 * candidates; where 1st Edition and Unlimited tie, the one whose prices
 * best agree with our (Unlimited) TCGplayer prices wins. */
function chooseExpansion(
	catalog: CardmarketCatalog,
	versions: Map<string, CardReadings>,
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
		for (const [key, readings] of versions) {
			// Plainest reading only: the print run isn't known yet.
			const ours = readings[0];
			const products = productsIn(catalog, key, expansion);
			if (products.length !== ours.length) continue;
			for (let i = 0; i < ours.length; i++) {
				const euros = catalog.priceByProduct.get(products[i].idProduct);
				const printing = ours[i].printings[0];
				const dollars = printing.tcgplayerProductId
					? tcgPrices[priceKey(printing.tcgplayerProductId, printing.foiling)]
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

	// Too few comparable prices to score: fall back to the most-voted one.
	if (!winner) return { expansion: ranked[0][0], ratio: null };
	return { expansion: winner.expansion, ratio: winner.ratio };
}

export function buildCardmarketSnapshot(
	setCode: string,
	printings: FabPrinting[],
	tcgPrices: Record<string, number>,
	catalog: CardmarketCatalog,
): { snapshot: SetCardmarketSnapshot; coverage: CardmarketCoverage } {
	// The expansion is chosen first; the print run is read from it.
	const allVersions = versionsOf(printings, null);
	const { expansion, ratio } = chooseExpansion(catalog, allVersions, tcgPrices);
	const edition = expansion ? editionForExpansion(catalog, expansion) : null;
	const versions = edition ? versionsOf(printings, edition) : allVersions;

	const cardPrices: Record<string, number> = {};
	let versionCount = 0;
	let priced = 0;
	let ambiguous = 0;
	let refinedPairings = 0;

	for (const [key, readings] of versions) {
		const products = expansion ? productsIn(catalog, key, expansion) : [];
		// Only an exact count match pairs; anything else is a guess.
		const ours =
			products.length > 0
				? readings.find((reading) => reading.length === products.length)
				: undefined;
		if (!ours) {
			versionCount += readings[0].length;
			ambiguous += readings[0].length;
			continue;
		}
		versionCount += ours.length;
		const prices = pricesByVersion(ours, products, catalog.priceByProduct);
		if (ours !== readings[0]) refinedPairings += ours.length;
		for (let i = 0; i < ours.length; i++) {
			const euros = prices[i];
			if (euros === undefined) continue;
			priced++;
			for (const printing of ours[i].printings) {
				cardPrices[printing.uniqueId] = euros;
			}
		}
	}

	const sealed = resolveSealedPrices(catalog, expansion, setCode);

	return {
		snapshot: {
			capturedAt: new Date().toISOString(),
			sourceUpdatedAt: catalog.sourceUpdatedAt,
			currency: "EUR",
			packPrice: sealed.packPrice,
			boxPrice: sealed.boxPrice,
			cardPrices,
		},
		coverage: {
			expansion,
			versions: versionCount,
			priced,
			ambiguous,
			refinedPairings,
			edition,
			ratio,
		},
	};
}
