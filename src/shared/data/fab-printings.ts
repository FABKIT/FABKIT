import { CardClasses } from "@fabkit/shared/config/cards/classes";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import { createCachedJsonLoader } from "@fabkit/shared/data/cached-json-loader";

/**
 * Real per-set, per-printing FAB card data, sourced from
 * github.com/the-fab-cube/flesh-and-blood-cards and pre-processed at build
 * time by scripts/build-pack-data.ts into one slim JSON file per set
 * (public/data/pack-opener/sets/<CODE>.json).
 *
 * Every *printing* of a card is its own row, because a card's rarity and
 * available foil treatments can differ between sets, and only per-set fidelity
 * lets a "Part the Mistveil pack" actually only ever show Part the Mistveil
 * cards at Part the Mistveil's own printed rarities.
 */

/**
 * A printing's foil treatment, as printed. pack/types.ts's DrawnCard carries
 * the same type for what got *drawn*; here it is a property of the printing
 * itself, independent of any pack simulation.
 */
export type FoilTreatment = "standard" | "rainbow" | "cold" | "gold-cold";

/** One real printing of one real card, within one set. */
export interface FabPrinting {
	/** Collector id, e.g. "MST131". A card and its Marvel version share this
	 * same id — see uniqueId below for the field that actually tells them
	 * apart, and printingImageUrl() for why `id` alone isn't safe to build
	 * an image URL from for every printing. */
	id: string;
	/** This printing's true identity (the-fab-cube's own unique_id) — unlike
	 * `id`, never shared with another printing. The euro price snapshot is
	 * keyed by it (see fab-prices-cm.ts). */
	uniqueId: string;
	name: string;
	rarity: CardRarity;
	foiling: FoilTreatment;
	/** Which print run this printing belongs to, verbatim from upstream:
	 * "A" Alpha, "F" First Edition, "U" Unlimited, "N" for the single-run
	 * sets that make up most of the game. The five oldest sets shipped the
	 * same card twice, in different foilings per run — Welcome to Rathe's
	 * Fyendal's Spring Tunic is a Cold Foil in Alpha and a Rainbow Foil in
	 * Unlimited — which is why a set's printings cannot be treated as one
	 * flat list when matching them against a marketplace that sells one run
	 * at a time. See scripts/cardmarket.ts's editionForExpansion. */
	edition: string;
	expansionSlot: boolean;
	/** Null when the-fab-cube has no TCGplayer mapping for this printing. */
	tcgplayerProductId: string | null;
	pitch: 1 | 2 | 3 | null;
	cost: number | null;
	power: number | null;
	defense: number | null;
	/** Raw card types from the source data (e.g. ["Brute", "Equipment",
	 * "Chest"] or ["Action"]) — verbatim, not normalised. Some early sets'
	 * official pack structures name a type directly (an "Equipment" slot,
	 * a generic-vs-class split on commons — see pack/set-configs.ts), which
	 * rarity alone can't express. */
	types: string[];
	/** e.g. ["FA"] on a Marvel/full-art printing — see printingImageUrl()
	 * below, which is the only current consumer. */
	artVariations: string[];
	/** The basename (no extension) of this printing's real artwork file,
	 * derived at build time from the upstream data's own image_url — e.g.
	 * "SEA001-MV" for a Marvel printing whose collector id is "SEA001".
	 * Null when the upstream data had no image_url to derive one from. See
	 * printingImageUrl() below for the one thing this is used for, and why
	 * it's scoped to Marvel printings only. */
	artSlug: string | null;
	/** The slug of the OTHER face's artwork, when this printing is one face
	 * of a double-faced card, otherwise null. Resolved at build time
	 * against the whole upstream dataset (see scripts/build-pack-data.ts's
	 * backSlugFor, which explains why it cannot be derived from `id` at
	 * runtime). Set on both faces, so a pack that draws either one can
	 * still show the other. */
	backSlug: string | null;
}

export interface FabSetPrintings {
	code: string;
	printings: FabPrinting[];
}

/**
 * Card art host — see src/apps/pack-opener/CLAUDE.md's "Card data" section
 * for the CORS verification notes (it needs an Origin header, which every
 * three.js texture loader sends by default).
 *
 * Built from the printing's own collector id (`printing.id`) for almost
 * every printing — that's correct and per-set. The one exception is Marvel:
 * a card and its Marvel version share the same collector id (`SEA001` is
 * both), so building the URL from `id` alone would show the base card's art
 * for a Marvel pull too. Marvel printings instead use `artSlug`, the real
 * artwork filename the upstream data actually carries for them (verified
 * live: content.fabrary.net serves a genuinely distinct image at that slug
 * for the large majority of Marvel printings).
 *
 * This is deliberately scoped to Marvel ONLY, not "any printing whose
 * artSlug differs from its id" — a great many non-Marvel printings also
 * have a differing slug (Unlimited-edition reprints, resized thumbnail
 * artifacts, and critically, real Rainbow/Cold Foil artwork with the foil
 * effect already baked into the image, which would double up with this
 * app's own foil shader). Using artSlug for those would be a real
 * regression, not an improvement.
 */
export function printingImageUrl(printing: FabPrinting): string {
	return cardArtUrl(printingArtSlug(printing));
}

/** The artwork filename a printing renders from, by the rule above. Shared
 * with the build script, which derives a card's back face from it. */
export function printingArtSlug(
	printing: Pick<FabPrinting, "id" | "rarity" | "artSlug">,
): string {
	return printing.rarity === "marvel" && printing.artSlug
		? printing.artSlug
		: printing.id;
}

/** The other face of a double-faced card, or null when it has only one.
 * The slug is already resolved (see FabPrinting.backSlug), so this is only
 * the URL shape — deliberately the same one printingImageUrl uses, rather
 * than a second host or path to keep in step. */
export function printingBackImageUrl(printing: FabPrinting): string | null {
	return printing.backSlug ? cardArtUrl(printing.backSlug) : null;
}

function cardArtUrl(slug: string): string {
	return `https://content.fabrary.net/cards/${slug}.webp`;
}

const printingsLoader = createCachedJsonLoader<FabSetPrintings>(
	(setCode) => `/data/pack-opener/sets/${setCode}.json`,
	(setCode) => `Set printing data fetch failed for ${setCode}`,
);

/** Fetches and caches one set's printing data (lazy, per set, so only the
 * selected set is ever loaded). */
export function loadSetPrintings(setCode: string): Promise<FabSetPrintings> {
	return printingsLoader.load(setCode);
}

/** Synchronous accessor — returns an empty array until loadSetPrintings()
 * for that set has resolved. */
export function getSetPrintings(setCode: string): FabPrinting[] {
	return printingsLoader.get(setCode)?.printings ?? [];
}

const CLASS_TYPE_NAMES = new Set(
	Object.keys(CardClasses)
		.filter((key) => key !== "none" && key !== "generic")
		.map((key) => key.toLowerCase()),
);

/** True when a printing's types include a hero class (Brute, Guardian,
 * Ninja, ...) — i.e. it's a class-restricted card, not a generic one.
 * Used to tell WTR/ARC's "4 Generic Commons" apart from their "7 Class
 * Commons" (see pack/set-configs.ts) — the-fab-cube's data has no
 * generic/class flag of its own, only the raw types array. */
export function isClassCard(printing: FabPrinting): boolean {
	return printing.types.some((type) =>
		CLASS_TYPE_NAMES.has(type.toLowerCase()),
	);
}

/** True when a printing's types include the given type name
 * (case-insensitive) — e.g. hasType(p, "Equipment"). */
export function hasType(printing: FabPrinting, type: string): boolean {
	const needle = type.toLowerCase();
	return printing.types.some((t) => t.toLowerCase() === needle);
}

/** One row of `public/data/pack-opener/index.json` — the set picker's data
 * source (see components/carousel/SetCarousel.tsx). Mirrors the index
 * entry shape scripts/build-pack-data.ts writes. */
export interface SetIndexEntry {
	code: string;
	name: string;
	/** ISO date string, or null when the-fab-cube has no release date for
	 * this set. */
	releaseDate: string | null;
	/** URL of the set's logo image, or null — Compendium of Rathe has none
	 * in the source data as of this writing; consumers need a name-only
	 * fallback (see SetCarousel.tsx). */
	setLogo: string | null;
	printingCount: number;
	/** Whether this is a mainline booster set or a supplementary sealed
	 * product (a Mastery Pack, an event prize pack). Decided in the pack
	 * opener's config/known-sets.ts and written into the index at build
	 * time; the set picker groups on it rather than listing everything in
	 * one undifferentiated chronological run. */
	productKind: "booster-set" | "supplemental";
	/** URLs of this set's uploaded 3D pack-front artwork
	 * (public/img/pack-opener/packs/<CODE>/1.webp, 2.webp, ...), in upload
	 * order. PackMesh.tsx falls back to the mock canvas-drawn pack when this is
	 * empty. */
	packArt: string[];
}

/** There is only one index file, so its one cache entry needs only one key. */
const SET_INDEX_KEY = "index";

const setIndexLoader = createCachedJsonLoader<{ sets: SetIndexEntry[] }>(
	() => "/data/pack-opener/index.json",
	() => "Set index fetch failed",
);

/** Fetches and caches the set list: booster sets by release date, then
 * supplemental products by name (see the build script's index sort), so the
 * last entry is not necessarily the newest set. */
export function loadSetIndex(): Promise<SetIndexEntry[]> {
	return setIndexLoader.load(SET_INDEX_KEY).then((data) => data.sets);
}

/** Synchronous accessor — returns an empty array until loadSetIndex() has
 * resolved (e.g. the index never loaded, offline/build output missing). */
export function getSetIndex(): SetIndexEntry[] {
	return setIndexLoader.get(SET_INDEX_KEY)?.sets ?? [];
}
