import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { Sparkles } from "@react-three/drei";

/** How each rarity tier celebrates. Deliberately escalating rather than
 * merely different: a Majestic is a good pull, a Legendary is a rare one,
 * and a Marvel is the rarest thing in the game, so each step up adds
 * particles, size and speed rather than swapping one look for another. */
interface SparkleSpec {
	count: number;
	size: number;
	speed: number;
	color: string;
	/** World-space box the particles live in, as [x, y, z]. Wide on
	 * purpose: the card fills most of the canvas vertically but only a
	 * fraction of it horizontally, so there is real room to either side of
	 * the card and almost none above or below it. Spreading sideways is
	 * what makes the effect visible at all rather than hidden behind the
	 * card. */
	area: [number, number, number];
}

const TIER_SPARKLES: Partial<Record<CelebrationTier, SparkleSpec>> = {
	majestic: {
		count: 28,
		size: 3,
		speed: 0.3,
		color: "#d4af37",
		area: [3.0, 2.0, 0.7],
	},
	legendary: {
		count: 62,
		size: 5,
		speed: 0.5,
		color: "#f0c26a",
		area: [3.6, 2.3, 0.9],
	},
	marvel: {
		count: 95,
		size: 6,
		speed: 0.7,
		color: "#ff8fc4",
		area: [4.0, 2.5, 1.0],
	},
};

/** How far behind the card the particles live. At least as far back as
 * PullCelebration's own glow plane, and for exactly the same reason: these
 * are additive and therefore in three.js's transparent queue, which always
 * draws after the opaque queue no matter what render order anything is
 * given. Any particle nearer the camera than the card's full tilt
 * excursion would paint straight over the card whenever the pointer tipped
 * it back. Sitting well clear of that arc means they can only ever appear
 * around the card, never on it. */
const SPARKLE_Z = -0.6;

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
	const spec = TIER_SPARKLES[tier];
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
