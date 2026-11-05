import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { getGlowTexture } from "@fabkit/apps/pack-opener/components/scene/textures/glow-texture";
import { CELEBRATION_BY_TIER } from "@fabkit/apps/pack-opener/config/celebration";
import {
	CARD_HEIGHT,
	CARD_WIDTH,
	CELEBRATION_Z,
	GLOW_ANIMATION_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { easeOutCubic } from "@fabkit/apps/pack-opener/lib/easing";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from "three";

interface PullCelebrationProps {
	tier: CelebrationTier;
	/** Same single timestamp every other reveal animation reads off (see
	 * stores/pack-opener.ts) — the glow's bloom-in restarts automatically
	 * whenever a new card becomes active, since that's exactly when this
	 * changes. */
	phaseStartedAt: number | null;
}

/** A soft glow behind the active card for a good pull, instead of moving the
 * camera in: the card getting physically bigger wasn't necessary, and it never
 * celebrated a plain Majestic or Legendary that happened not to be foil. A single
 * additive plane, tinted per tier, with one animated scale and opacity value
 * driving the bloom-in. Far cheaper than a particle system, so it holds up on
 * weak devices.
 *
 * Reduced motion: no animated bloom, just a fixed, modestly-sized presence, the
 * same posture as the foil's static sheen. */
export function PullCelebration({
	tier,
	phaseStartedAt,
}: PullCelebrationProps) {
	const meshRef = useRef<Mesh>(null);
	const materialRef = useRef<MeshBasicMaterial>(null);
	const reducedMotion = usePrefersReducedMotion();
	const { color, maxScale, maxOpacity } = CELEBRATION_BY_TIER[tier].glow;

	useFrame(() => {
		if (!meshRef.current || !materialRef.current) return;

		if (reducedMotion) {
			meshRef.current.scale.setScalar(maxScale * 0.85);
			materialRef.current.opacity = maxOpacity * 0.7;
			return;
		}

		const t =
			phaseStartedAt !== null
				? Math.min((Date.now() - phaseStartedAt) / GLOW_ANIMATION_MS, 1)
				: 1;
		const eased = easeOutCubic(t);
		// Blooms in from a smaller, fainter starting point rather than popping
		// straight to its resting size, reusing this one curve rather than a
		// second animation.
		meshRef.current.scale.setScalar(maxScale * (0.7 + 0.3 * eased));
		materialRef.current.opacity = maxOpacity * eased;
	});

	return (
		<mesh ref={meshRef} position={[0, 0, CELEBRATION_Z]} renderOrder={-1}>
			<planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
			<meshBasicMaterial
				ref={materialRef}
				map={getGlowTexture()}
				color={color}
				transparent
				opacity={0}
				depthWrite={false}
				blending={AdditiveBlending}
			/>
		</mesh>
	);
}
