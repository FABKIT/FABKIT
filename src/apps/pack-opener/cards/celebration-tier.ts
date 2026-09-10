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
 *  - Majestic: its own tier, whether or not this copy happens to be foil.
 *    Rarity deliberately outranks foiling here. It used to be the other way
 *    round, which was harmless while the only effect was a glow, but the
 *    tier now also decides whether a pull gets particles (see
 *    PullSparkles.tsx) — and a foil Majestic was falling through to "foil"
 *    and so getting LESS celebration than a plain one. A player who pulls a
 *    Majestic has pulled a Majestic; the foil is a bonus on top, already
 *    visible as the shader on the card face and named in the caption.
 *  - Any other foil treatment (Rainbow, Cold, Gold Cold): a spectral glow,
 *    covering a foiled Common/Rare/Super Rare that isn't already caught by
 *    a rarity tier above. No particles: the rarity is what is special, and
 *    a foil Common is not a rare pull.
 *  - Everything else (Common through Rare, Basic, Token): no celebration.
 */
export function celebrationTierFor(card: ResolvedCard): CelebrationTier | null {
	if (card.rarity === "marvel") return "marvel";
	if (card.rarity === "legendary" || card.rarity === "fabled") {
		return "legendary";
	}
	if (card.rarity === "majestic") return "majestic";
	if (card.treatment !== "standard") return "foil";
	return null;
}
