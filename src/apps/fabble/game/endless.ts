import type { FabbleCard } from "@fabkit/apps/fabble/types";

/**
 * Picks a random card from the full guessable universe (the same eligible pool Chaos mode
 * uses — every card in `dataset.cards`, banned cards included), excluding `excludeIds` so a
 * streak doesn't repeat an answer. Once every card has been excluded, repeats are allowed
 * again rather than throwing — a small dev fixture (~30 cards) would otherwise dead-end a
 * long streak.
 */
export function pickEndlessCard(
	cards: FabbleCard[],
	excludeIds: string[],
): FabbleCard {
	const excluded = new Set(excludeIds);
	const pool = cards.filter((c) => !excluded.has(c.id));
	const candidates = pool.length > 0 ? pool : cards;
	const index = Math.floor(Math.random() * candidates.length);
	return candidates[index];
}
