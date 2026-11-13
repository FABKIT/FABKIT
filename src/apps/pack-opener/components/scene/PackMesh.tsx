import { PackMaterial } from "@fabkit/apps/pack-opener/components/scene/PackMaterial";
import {
	applyTilt,
	easeTiltTowardPointer,
} from "@fabkit/apps/pack-opener/components/scene/pointerTilt";
import { TearBurst } from "@fabkit/apps/pack-opener/components/scene/TearBurst";
import {
	PACK_HEIGHT,
	PACK_SEAL_HEIGHT,
	PACK_TILT_MAX_DEG,
	PACK_WIDTH,
	TEAR_DURATION_MS,
	TEAR_START_DELAY_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { easeOutCubic } from "@fabkit/apps/pack-opener/lib/easing";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

const MAX_TILT_RAD = (PACK_TILT_MAX_DEG * Math.PI) / 180;

const BODY_HEIGHT = PACK_HEIGHT - PACK_SEAL_HEIGHT;
// Body's bottom edge sits at -PACK_HEIGHT/2, seal's top edge at +PACK_HEIGHT/2,
// with the seal occupying the top PACK_SEAL_HEIGHT strip of the pack.
const BODY_CENTER_Y = -PACK_SEAL_HEIGHT / 2;
const SEAL_CENTER_Y = PACK_HEIGHT / 2 - PACK_SEAL_HEIGHT / 2;

/** The closed booster pack: a portrait foil pouch (matching real FAB pack
 * proportions, roughly 1:2 width:height) that opens by tearing off a thin
 * top seal strip — not splitting the whole pack in half. Click/tap while
 * idle starts the tear via the store's openPack action. */
export function PackMesh() {
	const phase = usePackOpenerStore((state) => state.phase);
	const phaseStartedAt = usePackOpenerStore((state) => state.phaseStartedAt);
	const openPack = usePackOpenerStore((state) => state.openPack);
	const packArtUrl = usePackOpenerStore((state) => state.packArtUrl);
	const reducedMotion = usePrefersReducedMotion();

	const body = useRef<Mesh>(null);
	const seal = useRef<Mesh>(null);
	const group = useRef<Group>(null);
	const burst = useRef<Group>(null);
	const tilt = useRef({ x: 0, y: 0 });

	useFrame((state) => {
		if (!body.current || !seal.current || !group.current) return;

		// The pack holds closed for TEAR_START_DELAY_MS before the seal moves
		// at all, so the rip lands after the camera has settled into the
		// tearing shot rather than under a moving one — see that constant's
		// own comment in config/scene.ts.
		const elapsed =
			phase === "tearing" && phaseStartedAt !== null
				? Date.now() - phaseStartedAt - TEAR_START_DELAY_MS
				: 0;
		const t =
			elapsed > 0 ? easeOutCubic(Math.min(elapsed / TEAR_DURATION_MS, 1)) : 0;

		// Pointer tilt, same idea and same easing as the cards. A real foil pouch
		// shifts its sheen as you turn it, and the pack carries real printed foil
		// art worth turning. It lives on the outer group rather than on the body
		// mesh so it composes with the tear's own body.rotation.x below instead of
		// overwriting it, and it eases back to flat during the tear so it never
		// competes with that choreography.
		easeTiltTowardPointer(
			tilt.current,
			state.pointer,
			!reducedMotion && phase === "idle",
		);
		applyTilt(group.current, tilt.current, MAX_TILT_RAD);

		seal.current.position.y = SEAL_CENTER_Y + t * 1.9;
		seal.current.position.x = t * 0.35;
		seal.current.rotation.z = t * (Math.PI / 2.4);
		body.current.rotation.x = -t * 0.08;

		// Fires with the rip rather than during the hold before it. Read off the
		// store's timestamp like the rest of the tear, so a remount partway
		// through picks up where that tear actually is.
		if (burst.current) burst.current.visible = elapsed > 0;
	});

	return (
		<group ref={group}>
			<mesh
				ref={body}
				position={[0, BODY_CENTER_Y, 0]}
				onClick={() => phase === "idle" && openPack()}
			>
				<boxGeometry args={[PACK_WIDTH, BODY_HEIGHT, 0.09]} />
				<PackMaterial part="body" packArtUrl={packArtUrl} />
			</mesh>
			<mesh
				ref={seal}
				position={[0, SEAL_CENTER_Y, 0]}
				onClick={() => phase === "idle" && openPack()}
			>
				<boxGeometry args={[PACK_WIDTH, PACK_SEAL_HEIGHT, 0.1]} />
				<PackMaterial part="seal" packArtUrl={packArtUrl} />
			</mesh>
			{/* Particles have no meaningful still form, so reduced motion gets the
			    tear without them, the same call PullSparkles makes. */}
			{phase === "tearing" && !reducedMotion && (
				<group ref={burst} visible={false}>
					<TearBurst position={[0, BODY_HEIGHT / 2 + BODY_CENTER_Y, 0.1]} />
				</group>
			)}
		</group>
	);
}
