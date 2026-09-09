import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import {
	CARD_HEIGHT,
	CARD_WIDTH,
} from "@fabkit/apps/pack-opener/components/scene/Card3D";
import { getGlowTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useGlowTexture";
import { GLOW_ANIMATION_MS } from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
	AdditiveBlending,
	Color,
	type Mesh,
	type MeshBasicMaterial,
} from "three";

/** Tint per celebration tier — see cards/celebration-tier.ts for what earns
 * which tier. Warmer/gentler for Majestic, spectral for a general foil,
 * a stronger gold for Legendary/Fabled, and FABKIT's own Marvel accent
 * (matches text-pack-marvel, see PackSummary.tsx/RevealCaption.tsx) for the
 * biggest one. */
const TIER_COLOR: Record<CelebrationTier, string> = {
	majestic: "#d4af37",
	foil: "#8ecbff",
	legendary: "#e8b24d",
	marvel: "#ff6fae",
};

/** How much bigger than the card (CARD_WIDTH/CARD_HEIGHT) the glow grows at
 * its resting size — this multiplies a plane already sized to the card, so
 * 1.35 means "35% bigger than the card on every side put together". */
const TIER_MAX_SCALE: Record<CelebrationTier, number> = {
	majestic: 1.35,
	foil: 1.45,
	legendary: 1.6,
	marvel: 1.85,
};

/** Resting opacity per tier — Marvel and Legendary read as a clear flash;
 * Majestic stays gentle, per Louis's own description of the tiers. */
const TIER_MAX_OPACITY: Record<CelebrationTier, number> = {
	majestic: 0.35,
	foil: 0.4,
	legendary: 0.55,
	marvel: 0.7,
};

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

interface PullCelebrationProps {
	tier: CelebrationTier;
	/** Same single timestamp every other reveal animation reads off (see
	 * stores/pack-opener.ts) — the glow's bloom-in restarts automatically
	 * whenever a new card becomes active, since that's exactly when this
	 * changes. */
	phaseStartedAt: number | null;
}

/** A soft glow behind the active card for a genuinely good pull — replaces
 * the old camera dolly-in punch (see config/scene.ts's history and
 * CameraRig.tsx) per Louis's explicit feedback: the card getting physically
 * bigger wasn't necessary, and it never celebrated a plain Majestic/
 * Legendary pull that happened not to be foil. A single additive plane,
 * tinted per tier, with one animated scale/opacity value driving the
 * bloom-in — far cheaper than a particle system and holds up on weak
 * devices (see the execution plan, section 5, on this app's performance
 * budget). Sits just behind the active card (small negative z) inside
 * CardStack3D, and is the only thing celebrationTierFor() ever gates.
 *
 * Reduced motion: no animated bloom, just a fixed, modestly-sized presence
 * — same posture as Card3D's own reduced-motion tilt (a static sheen
 * rather than an animated one). */
export function PullCelebration({
	tier,
	phaseStartedAt,
}: PullCelebrationProps) {
	const meshRef = useRef<Mesh>(null);
	const materialRef = useRef<MeshBasicMaterial>(null);
	const reducedMotion = usePrefersReducedMotion();
	const texture = useMemo(() => getGlowTexture(), []);
	const color = useMemo(() => new Color(TIER_COLOR[tier]), [tier]);
	const maxScale = TIER_MAX_SCALE[tier];
	const maxOpacity = TIER_MAX_OPACITY[tier];

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
		// Blooms in from a smaller, fainter starting point rather than
		// popping straight to its resting size — the "flash" Louis asked
		// for, reusing this same curve rather than a second animation.
		meshRef.current.scale.setScalar(maxScale * (0.7 + 0.3 * eased));
		materialRef.current.opacity = maxOpacity * eased;
	});

	return (
		<mesh ref={meshRef} position={[0, 0, -0.05]} renderOrder={-1}>
			<planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
			<meshBasicMaterial
				ref={materialRef}
				map={texture}
				color={color}
				transparent
				opacity={0}
				depthWrite={false}
				blending={AdditiveBlending}
			/>
		</mesh>
	);
}
