import type { FabPrinting } from "@fabkit/shared/data/fab-printings";

/**
 * Cardmarket prices, for the European half of the audience: a TCGplayer
 * dollar price is close to meaningless when deciding what a card is worth
 * to someone buying in euros.
 *
 * Cardmarket withdrew their API and now publish flat files instead, all
 * public, all refreshed daily:
 *   productCatalog/productList/products_singles_16.json     the cards
 *   productCatalog/productList/products_nonsingles_16.json  the sealed product
 *   productCatalog/priceGuide/price_guide_16.json           what it all costs
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
 * one the data forces.
 *
 * FOUR READINGS OF "A VERSION", tried plainest first, each accepted only
 * if IT makes the two counts agree exactly. Our own data and Cardmarket's
 * genuinely draw the line in different places, and which place depends on
 * the card:
 *
 *   1. by foiling alone. The common case, and all that most cards need.
 *   2. + art variation. Everfest's Pulverize is a normal, a Rainbow Foil
 *      and an Extended Art Rainbow Foil: two versions by foiling, three
 *      once the art counts, and Cardmarket sells three.
 *   3. + collector number. Crucible of War's Mandible Claw is printed
 *      TWICE in the set, as CRU004 and CRU005. Cardmarket files both under
 *      one card but sells them as separate products, so its four are our
 *      two numbers times two foilings.
 *   4. + both.
 *
 * No reading is ever bent to fit: a card is priced only when one of them
 * pairs off with nothing left over on either side.
 *
 * ONE PRINT RUN AT A TIME, which is what makes 3 and 4 work at all. The
 * five oldest sets were printed more than once, and a card can carry
 * different foilings per run: Welcome to Rathe's Fyendal's Spring Tunic is
 * a Cold Foil in Alpha and a Rainbow Foil in Unlimited, so we counted two
 * versions against Cardmarket's one and gave up. A Cardmarket expansion is
 * one run, and it says so in the name of the booster filed under it
 * ("Welcome to Rathe - Unlimited Booster"), so the printings compared
 * against it are that run's. See editionForExpansion — this is read from
 * the data, never guessed, because an earlier attempt that simply picked
 * whichever run paired best matched Alpha Cold Foils against Unlimited
 * Rainbow Foil prices.
 *
 * Together with the name normalisation below this reaches about 98.5% of
 * card versions. What is left is the two catalogues genuinely describing
 * the same cardboard differently with nothing in either file to break the
 * tie, and it stays unpriced on purpose.
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
 *
 * SEALED PRODUCT comes from the nonsingles file and needs none of the
 * above: a booster is one product per expansion, named in plain words, and
 * the expansion this set resolved to for its cards is the same one its
 * boosters are filed under. See resolveSealedPrices.
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
	/** Nonsingles only — "Flesh And Blood Booster", "Flesh And Blood
	 * Booster Boxes", and the several categories of thing we don't want. */
	categoryName?: string;
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
	/** Trend price of a single sealed booster pack, or null when Cardmarket
	 * lists none for this set's expansion — the euro counterpart of
	 * SetPriceSnapshot.packMarketPrice, and never a converted dollar
	 * figure. See resolveSealedPrices. */
	packPrice: number | null;
	/** Trend price of a sealed booster box, same caveats. */
	boxPrice: number | null;
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
	/** Versions dropped because their version count disagreed with ours
	 * under BOTH readings of a version — see the file header. */
	ambiguous: number;
	/** Versions that needed a reading finer than "one per foiling" to pair
	 * — art variations, collector numbers, or both. Logged so a drop here
	 * is visible if either catalogue changes how it splits a card. */
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

/** The same card name written two ways by two catalogues, reduced to one
 * spelling. Three differences actually occur in the live files, and
 * between them they cost roughly a hundred card versions their price:
 *
 *   - the apostrophe. Ours is "Tremor of i'Arathael", Cardmarket's is
 *     "Tremor of iArathael".
 *   - stray whitespace. Cardmarket's "Invert Existence " has a trailing
 *     space, on every one of its five products.
 *   - double-faced cards. Ours is "Invoke Dracona Optimai", Cardmarket
 *     writes both faces: "Invoke Dracona Optimai // Dracona Optimai".
 *
 * Lowercased on top of that, since the two disagree on casing often enough
 * to matter and nothing here needs the name for display. Deliberately
 * conservative: it only removes punctuation and spacing, so two genuinely
 * different cards cannot collapse into one key. */
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
	/** expansion -> the sealed products filed under it (boosters, boxes,
	 * cases, decks, the lot) from the nonsingles file. Sealed product uses
	 * the SAME expansion ids the cards do, which is what lets a set's
	 * booster be found from the expansion its cards already resolved to. */
	sealedByExpansion: Map<number, CmProduct[]>;
	priceByProduct: Map<number, number>;
}

export async function fetchCardmarketCatalog(): Promise<CardmarketCatalog> {
	const [productFile, sealedFile, priceFile] = await Promise.all([
		fetch(PRODUCTS_URL).then((r) => {
			if (!r.ok) throw new Error(`Cardmarket products fetch: ${r.status}`);
			return r.json() as Promise<{ createdAt: string; products: CmProduct[] }>;
		}),
		fetch(SEALED_URL).then((r) => {
			if (!r.ok) throw new Error(`Cardmarket sealed fetch: ${r.status}`);
			return r.json() as Promise<{ products: CmProduct[] }>;
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

	for (const list of productsByCardInSet.values()) {
		list.sort(
			(a, b) =>
				a.dateAdded.localeCompare(b.dateAdded) || a.idProduct - b.idProduct,
		);
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

/** Cardmarket's booster category holds more than the booster a player
 * would actually buy to open: a Japanese printing, a First Edition
 * alongside an Unlimited one, Part the Mistveil's Golden Booster, High
 * Seas' Treasure Pack, Omens' World Premiere pack. None of those is the
 * pack this simulator opens, and several cost multiples of it, so a
 * careless pick would show a player a wildly wrong "what this pack cost".
 * Everything here is excluded by name, and anything left unmatched simply
 * yields no euro pack price rather than a wrong one. */
const SEALED_EXCLUSIONS =
	/japanese|case|display|blitz|golden|treasure|world premiere|bundle|first edition|1st edition|alpha/i;

/** The GEM Packs are five different products sharing ONE Cardmarket
 * expansion, numbered in their names ("GEM Pack Promos Booster 3"). Our
 * own codes carry the same number, so the two line up directly — without
 * this every GEM Pack would show GEM Pack 1's price. */
const GEM_CODE = /^GEM(\d)$/;

/** A set's sealed euro prices, looked up in the expansion its cards
 * already resolved to (see chooseExpansion). Null for either where
 * Cardmarket lists no booster or no box under that expansion, or where its
 * one listing has no trend price — never a converted dollar figure. */
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
		// More than one survivor means the exclusions above no longer
		// describe what Cardmarket lists, and picking one of several would
		// be the guess this file exists to avoid.
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

/** One card's versions under each reading, plainest first — see the file
 * header. Identical lists for the great majority of cards, which are
 * printed once, in one art, per foiling. */
type CardReadings = Version[][];

/** Collector number, then plainest foiling, then ordinary art before
 * Extended Art — the order Cardmarket adds products in, which is the whole
 * basis of the pairing. Verified against Crucible of War's Mandible Claw,
 * whose four products run 0.28, 5.68, 0.16, 4.12: CRU004 normal, CRU004
 * Rainbow Foil, CRU005 normal, CRU005 Rainbow Foil, so the collector
 * number is the OUTER sort and the foiling the inner one. The fields a
 * reading does not split on are empty everywhere and sort out of the way
 * on their own. */
function sortVersions(versions: Version[]): Version[] {
	return versions.sort(
		(a, b) =>
			a.cardId.localeCompare(b.cardId) ||
			(TREATMENT_ORDER[a.treatment] ?? 8) -
				(TREATMENT_ORDER[b.treatment] ?? 8) ||
			a.artVariation.localeCompare(b.artVariation),
	);
}

/** The four readings of one card's printings, built by merging the finest
 * grouping back down rather than regrouping from scratch each time, so
 * every reading is guaranteed to describe exactly the same printings. */
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
 * `edition` is set, only that print run's printings are considered — with
 * a fallback to all of them for a card that has none in that run, since
 * dropping such a card entirely would lose a price we could otherwise
 * prove. */
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

/** Which print run is this Cardmarket expansion? Read off the name of the
 * sealed booster filed under it, which is the only place either file says
 * so in words. Null for the single-run sets that are most of the game, and
 * for anything whose booster is not named after a run — in both cases
 * every printing is compared, exactly as before. */
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
			// Scored on the plainest reading only. This runs before any set
			// is paired, and before the print run is even known (that is
			// read off the expansion this is choosing), so it has to work
			// from the one reading that needs neither. It only has to tell
			// two candidate expansions apart, which it does on price.
			const ours = readings[0];
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
	setCode: string,
	printings: FabPrinting[],
	tcgPrices: Record<string, number>,
	catalog: CardmarketCatalog,
): { snapshot: CardmarketSnapshot; coverage: CardmarketCoverage } {
	// Which expansion first, on every printing we have, because the print
	// run is read OFF that expansion — then the readings are rebuilt for
	// that run alone. Two passes rather than one, over a few hundred cards
	// per set, which costs nothing next to the two catalogue downloads.
	const { expansion, ratio } = chooseExpansion(
		catalog,
		versionsOf(printings, null),
		tcgPrices,
	);
	const edition = expansion ? editionForExpansion(catalog, expansion) : null;
	const versions = versionsOf(printings, edition);

	const cardPrices: Record<string, number> = {};
	let versionCount = 0;
	let priced = 0;
	let ambiguous = 0;
	let refinedPairings = 0;

	for (const [key, readings] of versions) {
		const products = expansion ? productsIn(catalog, key, expansion) : [];
		// The forced pairing, and the only one we accept: same number of
		// versions on both sides means each of ours has exactly one of
		// theirs, in order. Anything else is a guess, so it gets no price.
		// Every reading of "a version" gets to try, plainest first (see the
		// file header); none is allowed to pair with anything left over on
		// either side, and an expansion we never resolved (no products at
		// all) pairs with nothing.
		const ours =
			products.length > 0
				? readings.find((reading) => reading.length === products.length)
				: undefined;
		if (!ours) {
			// Counted against the plainest reading, which is the honest
			// answer to "how many versions of this card do we know about"
			// when none of the readings pairs.
			versionCount += readings[0].length;
			ambiguous += readings[0].length;
			continue;
		}
		if (ours !== readings[0]) refinedPairings += ours.length;
		// Counted against the reading actually used, so the coverage figure
		// stays "how many versions we distinguish, and how many of those we
		// priced" rather than mixing readings' denominators.
		versionCount += ours.length;
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
