import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";

/** Which glow tier (if any) a pull earns, richest first — see the execution
 * plan, section 2.6. Rendered by PullCelebration.tsx as a soft glow behind
 * the active card, replacing the old camera dolly-in punch (Louis's
 * explicit feedback: the final card getting physically bigger wasn't
 * necessary, and it never celebrated a plain Majestic/Legendary pull that
 * happened not to be foil). */
export type CelebrationTier = "majestic" | "foil" | "legendary" | "marvel";

/**
 * Ordered richest first, and deliberately a chain of exclusive ifs rather
 * than independent checks: a card can be more than one of these at once
 * (a foil Legendary, a foil Majestic), and only the single richest tier
 * should glow, not a layered stack of them.
 *
 *  - Marvel: the rarest possible pull, always foil, gets the biggest glow.
 *  - Legendary/Fabled: celebrated regardless of foil treatment, since in
 *    most real sets a pulled Legendary is now always foil anyway (see
 *    card-resolver.ts's toResolvedCardFromPrinting), but some sets (History
 *    Pack 1, Compendium of Rathe, Bright Lights) print non-foil Legendaries
 *    too, and those still deserve the celebration.
 *  - Any other foil treatment (Rainbow, Cold, Gold Cold): a spectral glow,
 *    covering a foiled Rare/Super Rare/Majestic that isn't already caught
 *    by the two tiers above.
 *  - Majestic: even a plain, non-foil Majestic still gets a gentle glow of
 *    its own — Louis specifically asked for Majestic to be celebrated even
 *    when it isn't foil.
 *  - Everything else (Common through Rare, Basic, Token): no celebration.
 */
export function celebrationTierFor(card: ResolvedCard): CelebrationTier | null {
	if (card.rarity === "marvel") return "marvel";
	if (card.rarity === "legendary" || card.rarity === "fabled") {
		return "legendary";
	}
	if (card.treatment !== "standard") return "foil";
	if (card.rarity === "majestic") return "majestic";
	return null;
}
