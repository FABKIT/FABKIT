import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import { HINT_UNLOCK_THRESHOLDS, SET_NAME_TO_INDEX } from "./constants";
import { DISPLAY_TO_RARITY } from "./rarityUtils";
import type { DailyCard, FabbleMode } from "./types";

export type Hint =
	| { id: "rarity"; labelKey: string; value: CardRarity }
	| { id: "set"; labelKey: string; value: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Ranked by how desirable/distinctive they are as a hint — lower index = more premium.
const RARITY_RANK: Record<CardRarity, number> = {
	fabled: 0,
	legendary: 1,
	majestic: 2,
	superrare: 3,
	rare: 4,
	marvel: 5,
	common: 6,
	promo: 7,
	token: 8,
	basic: 9,
};

// Returns the slug of the most premium rarity present in the list.
function bestRaritySlug(rarities: string[]): CardRarity | null {
	if (rarities.length === 0) return null;
	const slugs = rarities
		.map((r) => DISPLAY_TO_RARITY[r])
		.filter(Boolean) as CardRarity[];
	if (slugs.length === 0) return null;
	return slugs.reduce(
		(best, slug) =>
			(RARITY_RANK[slug] ?? 99) < (RARITY_RANK[best] ?? 99) ? slug : best,
		slugs[0],
	);
}

// Return the first set that's a recognised mainline booster set.
function mainlineSet(sets: string[]): string {
	const mainline = sets.find((s) => SET_NAME_TO_INDEX[s] !== undefined);
	return mainline ?? sets[0] ?? "—";
}

// ─── generateHints ────────────────────────────────────────────────────────────

/**
 * Generates the fixed 2-hint sequence for a given daily card.
 * Hint 0 = most premium rarity slug (translate in UI via t(`rarity.${hint.value}`)).
 * Hint 1 = first mainline booster set display name.
 * Pure function — same DailyCard always produces the same hints.
 */
export function generateHints(daily: DailyCard): Hint[] {
	const raritySlug = bestRaritySlug(daily.rarities);
	return [
		{
			id: "rarity",
			labelKey: "hint.label.rarity",
			value: raritySlug ?? "common",
		},
		{
			id: "set",
			labelKey: "hint.label.set",
			value: mainlineSet(daily.sets),
		},
	];
}

/**
 * Returns how many hints are currently unlocked based on guess count.
 * Standard mode only — Chaos always returns 0.
 */
export function getAvailableHintCount(
	guessCount: number,
	mode: FabbleMode,
): number {
	if (mode !== "standard") return 0;
	return HINT_UNLOCK_THRESHOLDS.filter((t) => guessCount >= t).length;
}
