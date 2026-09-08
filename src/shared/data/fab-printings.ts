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
