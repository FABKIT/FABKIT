import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { getGlowTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useGlowTexture";
import { CELEBRATION_Z } from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	type Points,
	type PointsMaterial,
} from "three";

/** One full launch-to-fade cycle. The card can sit on screen indefinitely,
 * so this repeats rather than firing once: Louis asked for a fireworks
 * loop, and a single burst would be over before most players had finished
 * looking at the card. */
const BURST_PERIOD_MS = 2400;
/** Fraction of the cycle a shell spends visible; the rest is the dark beat
 * before the next one, which is what makes it read as repeated fireworks
 * rather than a continuous fountain. */
const BURST_ACTIVE = 0.72;

/** Which tiers launch fireworks at all. A Majestic gets PullSparkles'
 * drifting glitter and nothing more: the whole point of this component is
 * that a Legendary should look like a different KIND of event, not simply
 * more of the same one. */
const TIER_FIREWORKS: Partial<
	Record<CelebrationTier, { shells: number; perShell: number; color: string }>
> = {
	legendary: { shells: 3, perShell: 22, color: "#ffd77a" },
	marvel: { shells: 4, perShell: 26, color: "#ff9ed2" },
};

/** Layered just behind the shared celebration depth — see
 * CELEBRATION_Z in config/scene.ts for the render-queue reason every
 * effect back here has to respect. */
const FIREWORKS_Z = CELEBRATION_Z - 0.07;

const GRAVITY = 1.5;
const SHELL_SPREAD_X = 2.6;
const SHELL_SPREAD_Y = 1.2;

interface Shell {
	originX: number;
	originY: number;
	/** Where in the cycle this shell goes off, 0..1, so they do not all
	 * detonate on the same frame. */
	phase: number;
	velocities: Float32Array;
}

/** Bursting fireworks behind the card for the rarest pulls.
 *
 * Deliberately a different shape of motion from PullSparkles, which drifts
 * and twinkles in place. These launch from a point, fly outward, arc under
 * gravity and fade, then go again. That difference is the whole point: a
 * Legendary should read as a bigger event than a Majestic at a glance,
 * rather than as the same effect with the dial turned up.
 *
 * Timed off the same store timestamp everything else in this scene reads
 * (see stores/pack-opener.ts), using the elapsed time modulo the cycle
 * length, so a remount picks the loop up where it actually is instead of
 * restarting it — the invariant this app's CLAUDE.md sets out, and the one
 * that mount-timed animations kept breaking.
 *
 * One Points object for every shell's particles together, one draw call.
 * Nothing renders under prefers-reduced-motion: a firework has no
 * meaningful still frame, and the glow behind the card marks the pull on
 * its own. */
export function LegendaryFireworks({ tier }: { tier: CelebrationTier }) {
	const reducedMotion = usePrefersReducedMotion();
	const spec = TIER_FIREWORKS[tier];
	const points = useRef<Points>(null);
	const material = useRef<PointsMaterial>(null);
	const texture = useMemo(() => getGlowTexture(), []);
	const color = useMemo(
		() => new Color(spec?.color ?? "#ffffff"),
		[spec?.color],
	);

	// Fixed random layout per mount: the shells' origins and each particle's
	// launch direction. Only the animation replays each cycle, not the
	// shape, so the fireworks stay recognisably the same display rather
	// than reshuffling every 2.4 seconds.
	const shells = useMemo<Shell[]>(() => {
		if (!spec) return [];
		return Array.from({ length: spec.shells }, (_, index) => {
			const velocities = new Float32Array(spec.perShell * 3);
			for (let i = 0; i < spec.perShell; i++) {
				const angle = (i / spec.perShell) * Math.PI * 2 + Math.random() * 0.4;
				const speed = 0.75 + Math.random() * 0.55;
				velocities[i * 3] = Math.cos(angle) * speed;
				velocities[i * 3 + 1] = Math.sin(angle) * speed;
				velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
			}
			return {
				originX: (Math.random() - 0.5) * SHELL_SPREAD_X,
				originY: (Math.random() - 0.5) * SHELL_SPREAD_Y,
				phase: index / spec.shells,
				velocities,
			};
		});
	}, [spec]);

	const geometry = useMemo(() => {
		const total = shells.reduce(
			(sum, shell) => sum + shell.velocities.length / 3,
			0,
		);
		const buffer = new BufferGeometry();
		buffer.setAttribute(
			"position",
			new BufferAttribute(new Float32Array(total * 3), 3),
		);
		return buffer;
	}, [shells]);

	useFrame(() => {
		if (!points.current || !material.current || shells.length === 0) return;
		const attribute = geometry.getAttribute("position") as BufferAttribute;
		const array = attribute.array as Float32Array;
		const now = Date.now();
		let write = 0;
		let brightest = 0;

		for (const shell of shells) {
			// Each shell runs the same cycle, offset so they do not all go off
			// together.
			const cycle = (((now / BURST_PERIOD_MS + shell.phase) % 1) + 1) % 1;
			const t = cycle < BURST_ACTIVE ? cycle / BURST_ACTIVE : 1;
			const alive = cycle < BURST_ACTIVE;
			brightest = Math.max(brightest, alive ? 1 - t : 0);
			const count = shell.velocities.length / 3;
			for (let i = 0; i < count; i++) {
				if (alive) {
					array[write] = shell.originX + shell.velocities[i * 3] * t;
					array[write + 1] =
						shell.originY +
						shell.velocities[i * 3 + 1] * t -
						GRAVITY * t * t * 0.5;
					array[write + 2] = shell.velocities[i * 3 + 2] * t;
				} else {
					// Parked far behind the camera's view rather than left at
					// their last position, so a spent shell shows nothing at
					// all instead of a frozen ring.
					array[write] = 0;
					array[write + 1] = 0;
					array[write + 2] = -999;
				}
				write += 3;
			}
		}

		attribute.needsUpdate = true;
		// Fades as the shells burn out, so the loop breathes rather than
		// pulsing at constant brightness.
		material.current.opacity = 0.25 + 0.75 * brightest;
	});

	if (!spec || reducedMotion) return null;

	return (
		<points ref={points} geometry={geometry} position={[0, 0, FIREWORKS_Z]}>
			<pointsMaterial
				ref={material}
				map={texture}
				color={color}
				size={0.22}
				sizeAttenuation
				transparent
				depthWrite={false}
				blending={AdditiveBlending}
			/>
		</points>
	);
}
