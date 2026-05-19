import type { FabbleMode } from "./types";

// ─── Set release order ────────────────────────────────────────────────────────
// 19 confirmed booster set codes in confirmed release order (Decision #3).
// Cards from set codes not in this list get earliestSetIndex = Infinity and
// emit a build-time warning. The 3-char prefix is extracted from setIdentifiers
// (e.g. "MST131" → "MST").
export const SET_ORDER: string[] = [
	"WTR", // Welcome to Rathe
	"ARC", // Arcane Rising
	"CRU", // Crucible of War
	"MON", // Monarch
	"ELE", // Tales of Aria
	"EVR", // Everfest
	"1HP", // History Pack 1
	"UPR", // Uprising
	"DYN", // Dynasty
	"OUT", // Outsiders
	"DTD", // Dusk till Dawn
	"EVO", // Bright Lights (Evo)
	"HVY", // Heavy Hitters
	"MST", // Part the Mistveil
	"ROS", // Rosetta
	"HNT", // The Hunted
	"SEA", // High Seas
	"SMP", // Super Slam
	"SUP", // Omens of the Third Age
];

// ─── Guess limits per mode ────────────────────────────────────────────────────
export const GUESS_LIMITS: Record<FabbleMode, number> = {
	standard: 8,
	chaos: 12,
};

// ─── Autocomplete ─────────────────────────────────────────────────────────────
export const AUTOCOMPLETE_MAX_RESULTS = 10;

// ─── Hint system ─────────────────────────────────────────────────────────────
// Standard mode only. Index 0 = guess count at which hint 1 unlocks, etc.
export const HINT_UNLOCK_THRESHOLDS: number[] = [3, 5];

// ─── Animation timing ─────────────────────────────────────────────────────────
// TILE_FLIP_DURATION_MS: duration of the tile flip animation (GuessGrid live text delay)
// POST_SOLVE_DELAY_MS: delay before post-solve panel appears (100ms after flip completes)
export const TILE_FLIP_DURATION_MS = 1300;
export const POST_SOLVE_DELAY_MS = 1400;

// ─── Type exclusions (applied in both Standard and Chaos filters) ─────────────
// These types are not "cards" in the deduction sense.
export const EXCLUDED_TYPES: Set<string> = new Set([
	"Token",
	"Mentor",
	"Resource",
	"Demi-Hero",
	"Macro",
	"Meld",
	"Event",
	"Block",
	"Companion",
]);

// ─── CDN base URL for card images ────────────────────────────────────────────
// Full URL = `${FAB_CDN_BASE}${defaultImage}.webp`
// Example: "https://content.fabrary.net/cards/MST131.webp"
export const FAB_CDN_BASE = "https://content.fabrary.net/cards/";

// ─── Set name → release order index ──────────────────────────────────────────
// Kept in setOrder.generated.ts — edit data/set-release-order.csv and re-run
// scripts/generate-set-order.ts instead of editing that file directly.
export { SET_NAME_TO_INDEX } from "./setOrder.generated";

