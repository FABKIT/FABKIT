import {
	DONE_CAMERA_POSITION,
	IDLE_CAMERA_POSITION,
	REVEALING_CAMERA_POSITION,
	TEARING_CAMERA_POSITION,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import type { PackOpenerPhase } from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";

/** Fixed per phase; a good pull gets a glow, not a camera move. */
function targetForPhase(phase: PackOpenerPhase): [number, number, number] {
	if (phase === "tearing") return TEARING_CAMERA_POSITION;
	if (phase === "done") return DONE_CAMERA_POSITION;
	if (phase === "revealing") return REVEALING_CAMERA_POSITION;
	return IDLE_CAMERA_POSITION;
}

/** Scripted camera driven entirely by pack-opener store state — no OrbitControls,
 * this is a cinematic view the user never takes manual control of. */
export function CameraRig() {
	const camera = useThree((state) => state.camera);
	const phase = usePackOpenerStore((state) => state.phase);
	const reducedMotion = usePrefersReducedMotion();
	const target = useRef(new Vector3(...IDLE_CAMERA_POSITION));
	const previousPhase = useRef(phase);

	useFrame((_, delta) => {
		const [x, y, z] = targetForPhase(phase);
		const idleBobY =
			phase === "idle" && !reducedMotion
				? Math.sin(Date.now() / 1500) * 0.03
				: 0;
		target.current.set(x, y + idleBobY, z);

		// Pack open is a scene change: jump, don't ease.
		const enteringTear = phase === "tearing" && previousPhase.current !== phase;
		previousPhase.current = phase;
		if (enteringTear) {
			camera.position.copy(target.current);
		} else {
			camera.position.lerp(target.current, 1 - 0.001 ** delta);
		}
		camera.lookAt(0, 0, 0);
	});

	return null;
}
