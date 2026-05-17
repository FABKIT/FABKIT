import { HINT_UNLOCK_THRESHOLDS, SET_NAME_TO_INDEX } from "./constants";
import type { DailyCard } from "./types";

export interface Hint {
	id: "rarity" | "set";
	labelKey: string;
	value: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RARITY_RANK: Record<string, number> = {
	Legendary: 0,
	Majestic: 1,
	"Super Rare": 2,
	Rare: 3,
	Common: 4,
	Promo: 5,
	Marvel: 6,
	Fabled: 7,
	Basic: 8,
};

// Pick the most "premium" rarity so "Rare, Promo" shows "Rare" not "Promo"
function bestRarity(rarities: string[]): string {
	if (rarities.length === 0) return "—";
	return rarities.reduce((best, r) =>
		(RARITY_RANK[r] ?? 99) < (RARITY_RANK[best] ?? 99) ? r : best,
		rarities[0],
	);
}

// Return the first set that's a recognised mainline booster set.
// Falls back to sets[0] if no mainline set found (shouldn't normally happen).
function mainlineSet(sets: string[]): string {
	const mainline = sets.find((s) => SET_NAME_TO_INDEX[s] !== undefined);
	return mainline ?? sets[0] ?? "—";
}

// ─── generateHints ────────────────────────────────────────────────────────────

/**
 * Generates the fixed 2-hint sequence for a given daily card.
 * Hint 0 = best (most premium) rarity.
 * Hint 1 = first mainline booster set (not armory/promo).
 * Pure function — same DailyCard always produces the same hints.
 */
export function generateHints(daily: DailyCard): Hint[] {
	return [
		{
			id: "rarity",
			labelKey: "hint.label.rarity",
			value: bestRarity(daily.rarities),
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
	mode: string,
): number {
	if (mode !== "standard") return 0;
	return HINT_UNLOCK_THRESHOLDS.filter((t) => guessCount >= t).length;
}
