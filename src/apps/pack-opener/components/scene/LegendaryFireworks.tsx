import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { getGlowTexture } from "@fabkit/apps/pack-opener/components/scene/textures/glow-texture";
import {
	CELEBRATION_BY_TIER,
	type FireworksSpec,
} from "@fabkit/apps/pack-opener/config/celebration";
import { CELEBRATION_Z } from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	type PointsMaterial,
} from "three";

/** One full launch-to-fade cycle. The card can sit on screen indefinitely, so
 * this repeats rather than firing once: a single burst would be over before most
 * players had finished looking at the card. */
const BURST_PERIOD_MS = 2400;
/** Fraction of the cycle a shell spends visible; the rest is the dark beat
 * before the next one, which is what makes it read as repeated fireworks
 * rather than a continuous fountain. */
const BURST_ACTIVE = 0.72;

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

/** A random layout: the shells' origins and each particle's launch direction. */
function buildShells(spec: FireworksSpec): Shell[] {
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
}

/** One Points object for every shell's particles together, one draw call. */
function FireworksPoints({ spec }: { spec: FireworksSpec }) {
	const material = useRef<PointsMaterial>(null);

	// Fixed per mount, so only the animation replays each cycle and the fireworks
	// stay recognisably the same display rather than reshuffling every 2.4
	// seconds. Memoised for that stability, not for speed: the frame callback
	// below writes into this exact buffer.
	const shells = useMemo(() => buildShells(spec), [spec]);
	const geometry = useMemo(() => {
		const total = spec.shells * spec.perShell;
		const buffer = new BufferGeometry();
		buffer.setAttribute(
			"position",
			new BufferAttribute(new Float32Array(total * 3), 3),
		);
		return buffer;
	}, [spec]);

	// r3f only disposes what it created from JSX, and this arrives as a prop.
	useEffect(() => () => geometry.dispose(), [geometry]);

	useFrame(() => {
		if (!material.current) return;
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

	return (
		<points geometry={geometry} position={[0, 0, FIREWORKS_Z]}>
			<pointsMaterial
				ref={material}
				map={getGlowTexture()}
				color={spec.color}
				size={0.22}
				sizeAttenuation
				transparent
				depthWrite={false}
				blending={AdditiveBlending}
			/>
		</points>
	);
}

/** Bursting fireworks behind the card for the rarest pulls.
 *
 * Deliberately a different shape of motion from PullSparkles, which drifts
 * and twinkles in place. These launch from a point, fly outward, arc under
 * gravity and fade, then go again. That difference is the whole point: a
 * Legendary should read as a bigger event than a Majestic at a glance,
 * rather than as the same effect with the dial turned up.
 *
 * Timed off the wall clock modulo the cycle length, so a remount picks the loop
 * up where it actually is instead of restarting it, the invariant this app's
 * CLAUDE.md sets out.
 *
 * Nothing renders under prefers-reduced-motion: a firework has no meaningful
 * still frame, and the glow behind the card marks the pull on its own. */
export function LegendaryFireworks({ tier }: { tier: CelebrationTier }) {
	const reducedMotion = usePrefersReducedMotion();
	const spec = CELEBRATION_BY_TIER[tier].fireworks;
	if (!spec || reducedMotion) return null;
	return <FireworksPoints key={tier} spec={spec} />;
}
