import { CardClasses } from "@fabkit/shared/config/cards/classes";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import { createCachedJsonLoader } from "@fabkit/shared/data/cached-json-loader";

/** Real per-set, per-printing FAB card data. Every printing is its own row, since
 * rarity and foil treatments can differ between sets. */

/**
 * A printing's foil treatment, as printed. pack/types.ts's DrawnCard carries
 * the same type for what got *drawn*; here it is a property of the printing
 * itself, independent of any pack simulation.
 */
export type FoilTreatment = "standard" | "rainbow" | "cold" | "gold-cold";

/** One real printing of one real card, within one set. */
export interface FabPrinting {
	/** Collector id, e.g. "MST131". A card and its Marvel version share it;
	 * see uniqueId and printingImageUrl(). */
	id: string;
	/** This printing's true identity (the-fab-cube's own unique_id) — unlike
	 * `id`, never shared with another printing. The euro price snapshot is
	 * keyed by it (see fab-prices-cm.ts). */
	uniqueId: string;
	name: string;
	rarity: CardRarity;
	foiling: FoilTreatment;
	/** Print run, verbatim from upstream: "A" Alpha, "F" First Edition, "U"
	 * Unlimited, "N" single-run. The oldest sets differ in foilings per run,
	 * so printings are not one flat list (see scripts/cardmarket.ts). */
	edition: string;
	expansionSlot: boolean;
	/** Null when the-fab-cube has no TCGplayer mapping for this printing. */
	tcgplayerProductId: string | null;
	pitch: 1 | 2 | 3 | null;
	cost: number | null;
	power: number | null;
	defense: number | null;
	/** Raw card types from the source data (e.g. ["Brute", "Equipment"]),
	 * verbatim. Some pack structures name a type directly (see
	 * pack/set-configs.ts). */
	types: string[];
	/** e.g. ["FA"] on a Marvel/full-art printing — see printingImageUrl()
	 * below, which is the only current consumer. */
	artVariations: string[];
	/** Basename of this printing's artwork file (e.g. "SEA001-MV"), from the
	 * upstream image_url; null if none. Used only for Marvel (printingImageUrl). */
	artSlug: string | null;
	/** Slug of the other face's artwork when this is one face of a
	 * double-faced card, else null. Resolved at build time (see
	 * scripts/build-pack-data.ts's backSlugFor); set on both faces. */
	backSlug: string | null;
}

export interface FabSetPrintings {
	code: string;
	printings: FabPrinting[];
}

/**
 * Card art URL (CORS notes: src/apps/pack-opener/CLAUDE.md, "Card data").
 *
 * Built from the collector id, except Marvel: a card and its Marvel version
 * share one id, so Marvel printings use `artSlug`. Scoped to Marvel only:
 * other differing slugs include foil-baked artwork, which would double up
 * with the app's own foil shader.
 */
export function printingImageUrl(printing: FabPrinting): string {
	return cardArtUrl(printingArtSlug(printing));
}

/** The artwork filename a printing renders from, by the rule above. Shared
 * with the build script. */
export function printingArtSlug(
	printing: Pick<FabPrinting, "id" | "rarity" | "artSlug">,
): string {
	return printing.rarity === "marvel" && printing.artSlug
		? printing.artSlug
		: printing.id;
}

/** The other face's artwork URL, or null when there is only one face. */
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

/** True when a printing's types include a hero class, i.e. it is not generic
 * (the data has no generic/class flag of its own). */
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

/** One row of `public/data/pack-opener/index.json`, as written by
 * scripts/build-pack-data.ts; the set picker's data source. */
export interface SetIndexEntry {
	code: string;
	name: string;
	/** ISO date string, or null when the-fab-cube has no release date for
	 * this set. */
	releaseDate: string | null;
	/** URL of the set's logo image, or null (consumers need a name-only fallback). */
	setLogo: string | null;
	printingCount: number;
	/** Mainline booster set or supplementary sealed product; the set picker groups on it. */
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
