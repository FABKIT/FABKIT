import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";

/** Which glow tier (if any) a pull earns. "chase" is the richest, shared by Marvel and Fabled. */
export type CelebrationTier = "majestic" | "foil" | "legendary" | "chase";

/** Richest tier first, as exclusive checks so only one tier glows. Rarity outranks
 * foiling: a foil Majestic is a Majestic. Other foils get a glow, but a foil Common
 * is not a rare pull. */
export function celebrationTierFor(card: ResolvedCard): CelebrationTier | null {
	if (card.rarity === "marvel" || card.rarity === "fabled") return "chase";
	if (card.rarity === "legendary") return "legendary";
	if (card.rarity === "majestic") return "majestic";
	if (card.treatment !== "standard") return "foil";
	return null;
}
