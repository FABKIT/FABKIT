import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";

/** Shuffles a pack's cards for reveal, but always pins the premium-foil slot's
 * card to the final index for a climactic last pull. Preserves the exact
 * multiset of card ids — nothing lost or duplicated. */
export function orderForReveal(
	cards: DrawnCard[],
	rng: () => number = Math.random,
): DrawnCard[] {
	const premiumIndex = cards.findIndex((card) => card.slot === "premium-foil");
	const rest =
		premiumIndex === -1
			? [...cards]
			: cards.filter((_, index) => index !== premiumIndex);

	for (let i = rest.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[rest[i], rest[j]] = [rest[j], rest[i]];
	}

	return premiumIndex === -1 ? rest : [...rest, cards[premiumIndex]];
}
