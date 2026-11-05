import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { CELEBRATION_BY_TIER } from "@fabkit/apps/pack-opener/config/celebration";
import { CELEBRATION_Z } from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { Sparkles } from "@react-three/drei";

/** Layered just behind the shared celebration depth — see
 * CELEBRATION_Z in config/scene.ts for the render-queue reason every
 * effect back here has to respect. */
const SPARKLE_Z = CELEBRATION_Z - 0.05;

/** Particles behind the card for a genuinely rare pull.
 *
 * Deliberately keyed off RARITY, not foiling. Most cards in most packs are
 * Commons and Rares, so pulling a Majestic or a Legendary is the moment
 * worth marking, whether or not that particular copy happens to be foil.
 * The foil treatments have their own thing already: the shader on the card
 * face (materials/foilMaterial.ts) and, for a foil that is not otherwise
 * rare, PullCelebration's glow. So the "foil" tier gets no particles here.
 *
 * This sits alongside PullCelebration rather than replacing it: the glow is
 * the soft light behind the card, this is the sparkle in front of that
 * light. Both are cheap; drei's Sparkles is one instanced points draw, the
 * same component the pack tear already uses (see TearBurst.tsx).
 *
 * Nothing renders under prefers-reduced-motion. Unlike the glow, which can
 * degrade to a still image, drifting twinkling particles have no meaningful
 * static form, and the glow still marks the pull on its own. */
export function PullSparkles({ tier }: { tier: CelebrationTier }) {
	const reducedMotion = usePrefersReducedMotion();
	const spec = CELEBRATION_BY_TIER[tier].sparkles;
	if (!spec || reducedMotion) return null;
	return (
		<Sparkles
			count={spec.count}
			scale={spec.area}
			size={spec.size}
			speed={spec.speed}
			color={spec.color}
			position={[0, 0, SPARKLE_Z]}
		/>
	);
}
