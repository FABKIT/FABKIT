import { CardClasses } from "@fabkit/shared/config/cards/classes";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

/**
 * Real per-set, per-printing FAB card data, sourced from
 * github.com/the-fab-cube/flesh-and-blood-cards and pre-processed at build
 * time by scripts/build-pack-data.ts into one slim JSON file per set
 * (public/data/pack-opener/sets/<CODE>.json).
 *
 * This module is deliberately separate from fab-card-dataset.ts, which
 * Fabble also consumes and which this file must not touch (see that file's
 * own comment). The two datasets solve different problems:
 *
 * - fab-card-dataset.ts: one rarity/image per card, no per-set fidelity.
 *   Good enough for Fabble's trivia use case.
 * - fab-printings.ts (this file): every *printing* of a card is its own
 *   row, because a card's rarity and available foil treatments can differ
 *   between sets, and only per-set fidelity lets a "Part the Mistveil pack"
 *   actually only ever show Part the Mistveil cards at Part the Mistveil's
 *   own printed rarities. See the execution plan, section 2.1-2.2, for the
 *   full reasoning.
 *
 * pack-opener's own card-resolver.ts (cards/card-resolver.ts) is what
 * switches over to this module — that swap, plus the rest of the odds
 * engine work, is a later commit. This file is pure data plumbing with no
 * app dependents yet.
 */

/**
 * A printing's foil treatment, as printed. Distinct from
 * `pack/types.ts`'s DrawnCard.foil/marvel booleans (a property of what got
 * *drawn*, wired up in a later commit) — this is a property of the
 * printing itself, independent of any pack simulation.
 */
export type FoilTreatment = "standard" | "rainbow" | "cold" | "gold-cold";

/** One real printing of one real card, within one set. */
export interface FabPrinting {
	/** Collector id, e.g. "MST131". Also the key used to build the card
	 * image URL — see printingImageUrl() below. */
	id: string;
	name: string;
	rarity: CardRarity;
	foiling: FoilTreatment;
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
}

export interface FabSetPrintings {
	code: string;
	printings: FabPrinting[];
}

/** Card art host — see src/apps/pack-opener/CLAUDE.md's "Card data" section
 * for the CORS verification notes (it needs an Origin header, which every
 * three.js texture loader sends by default). Built from the printing's own
 * collector id rather than mirrored, so per-set art is always correct. */
export function printingImageUrl(printingId: string): string {
	return `https://content.fabrary.net/cards/${printingId}.webp`;
}

const setCache = new Map<string, FabSetPrintings>();
const loadPromises = new Map<string, Promise<FabSetPrintings>>();

/** Fetches and caches one set's printing data (lazy, per set — see the
 * plan's size note: 33-58 KB per set, only the selected set is ever
 * loaded). Safe to call more than once for the same set code; subsequent
 * calls reuse the same in-flight/settled promise. */
export function loadSetPrintings(setCode: string): Promise<FabSetPrintings> {
	const cached = setCache.get(setCode);
	if (cached) return Promise.resolve(cached);

	const inFlight = loadPromises.get(setCode);
	if (inFlight) return inFlight;

	const promise = fetch(`/data/pack-opener/sets/${setCode}.json`)
		.then((response) => {
			if (!response.ok) {
				throw new Error(
					`Set printing data fetch failed for ${setCode}: ${response.status}`,
				);
			}
			return response.json() as Promise<FabSetPrintings>;
		})
		.then((data) => {
			setCache.set(setCode, data);
			loadPromises.delete(setCode);
			return data;
		});

	loadPromises.set(setCode, promise);
	return promise;
}

/** Synchronous accessor — returns an empty array until loadSetPrintings()
 * for that set has resolved. */
export function getSetPrintings(setCode: string): FabPrinting[] {
	return setCache.get(setCode)?.printings ?? [];
}

/** Printings of a given rarity within a set, excluding expansion-slot
 * printings unless asked for — expansion slot cards are a distinct pull,
 * not part of a rarity's normal pool (see the plan, section 5.2). */
export function getSetPrintingsByRarity(
	setCode: string,
	rarity: CardRarity,
	options: { includeExpansionSlot?: boolean } = {},
): FabPrinting[] {
	const includeExpansionSlot = options.includeExpansionSlot ?? false;
	return getSetPrintings(setCode).filter(
		(printing) =>
			printing.rarity === rarity &&
			(includeExpansionSlot || !printing.expansionSlot),
	);
}

/** Expansion-slot printings within a set, regardless of rarity. */
export function getSetExpansionSlotPrintings(setCode: string): FabPrinting[] {
	return getSetPrintings(setCode).filter((printing) => printing.expansionSlot);
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
	/** URLs of this set's uploaded 3D pack-front artwork
	 * (public/img/pack-opener/packs/<CODE>/1.webp, 2.webp, ...), in upload
	 * order — see the execution plan, section 7.1. Empty until the product
	 * owner uploads at least one; PackMesh.tsx falls back to the mock
	 * canvas-drawn pack when this is empty (see the plan's section 8.6
	 * degradation ladder — the composited-logo fallback described there
	 * needs a template asset that doesn't exist yet, so this is currently
	 * a two-rung ladder, not three). */
	packArt: string[];
}

let setIndexCache: SetIndexEntry[] | null = null;
let setIndexPromise: Promise<SetIndexEntry[]> | null = null;

/** Fetches and caches the set list (sorted by release date — see the build
 * script). Safe to call more than once; subsequent calls reuse the same
 * in-flight/settled promise, same pattern as loadSetPrintings above. */
export function loadSetIndex(): Promise<SetIndexEntry[]> {
	if (setIndexCache) return Promise.resolve(setIndexCache);
	if (setIndexPromise) return setIndexPromise;

	const promise = fetch("/data/pack-opener/index.json")
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Set index fetch failed: ${response.status}`);
			}
			return response.json() as Promise<{ sets: SetIndexEntry[] }>;
		})
		.then((data) => {
			setIndexCache = data.sets;
			setIndexPromise = null;
			return data.sets;
		});

	setIndexPromise = promise;
	return promise;
}

/** Synchronous accessor — returns an empty array until loadSetIndex() has
 * resolved (e.g. the index never loaded, offline/build output missing). */
export function getSetIndex(): SetIndexEntry[] {
	return setIndexCache ?? [];
}
