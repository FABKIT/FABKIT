import type { PackConfig } from "@fabkit/apps/pack-opener/pack/types";
import { expectedRarityCounts } from "@fabkit/apps/pack-opener/stats/session-stats";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

export interface PullRateRow {
	rarity: CardRarity;
	/** Expected cards of this rarity per pack, straight from
	 * stats/session-stats.ts's expectedRarityCounts — the same number
	 * SessionStatsDialog.tsx compares actual pulls against, so
	 * SetInfoDialog.tsx's pull-rates section can never quietly drift out of
	 * sync with what the odds engine (and the session summary) actually
	 * believe. */
	expectedPerPack: number;
}

/** Below this share of the pack, a percentage reads as more precise than it
 * is (see the execution plan, section 1.7) — "0.4%" is harder to reason
 * about than "about 1 in 240 packs" for the genuinely rare stuff. 1 percent
 * of a pack is the threshold Louis asked for. Exported so SetInfoDialog.tsx
 * and this module's own tests agree on the exact same crossover point. */
export const PERCENT_DISPLAY_THRESHOLD = 1;

/** Turns a set's own PackConfig into pull-rate rows, ordered most common to
 * rarest. Every number here is derived live from the engine's own weights —
 * never a separately-authored copy of fabtcg.com's wording — so it can't
 * drift out of sync with what generatePack() actually draws. Pulled out of
 * SetInfoDialog.tsx (a UI component) into its own pure module, same as
 * every other pack/*.ts file, so this math is independently testable. */
export function pullRateRows(config: PackConfig): PullRateRow[] {
	const expected = expectedRarityCounts(config);
	return Object.entries(expected)
		.map(([rarity, count]) => ({
			rarity: rarity as CardRarity,
			expectedPerPack: count ?? 0,
		}))
		.filter((row) => row.expectedPerPack > 0)
		.sort((a, b) => b.expectedPerPack - a.expectedPerPack);
}

/** A rate's share of the pack as a percentage — the number
 * PERCENT_DISPLAY_THRESHOLD is compared against to decide whether a row
 * shows a percentage or switches to "about 1 in N packs" phrasing. */
export function percentOfPack(row: PullRateRow, config: PackConfig): number {
	return (row.expectedPerPack / config.cardsPerPack) * 100;
}

/** How many of a pack's cards are guaranteed tokens.
 *
 * Real packs print a smaller number on the wrapper than fabtcg.com's own
 * product pages state, and both are correct: fabtcg counts the token, the
 * printed wrapper does not. Welcome to Rathe is the clearest case, its
 * product page says "A booster pack contains 16 cards, being: 1 Token per
 * pack; 4 Generic Commons; ..." while the pack itself reads "15-Card
 * Booster Pack". So the app shows the printed count with the token called
 * out beside it, and this is where that split is worked out.
 *
 * Only slots that are ALWAYS a token count. A "token-or-wildcard" slot (the
 * Heavy Hitters family) can land on a real card, so subtracting it would
 * understate the pack. That leaves Heavy Hitters at 15 plus 1 token rather
 * than 14, which is what its wrapper says.
 *
 * Nothing about the odds engine depends on this. cardsPerPack itself stays
 * exactly as fabtcg publishes it, because every pull-rate percentage
 * divides by it (see percentOfPack above). This is a labelling helper only.
 */
export function guaranteedTokenCount(config: PackConfig): number {
	return config.slots
		.filter((slot) => slot.kind === "token")
		.reduce((total, slot) => total + slot.count, 0);
}
