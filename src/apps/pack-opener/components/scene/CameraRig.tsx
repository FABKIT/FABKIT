import {
	DONE_CAMERA_POSITION,
	IDLE_CAMERA_POSITION,
	REVEALING_CAMERA_POSITION,
	TEARING_CAMERA_POSITION,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";

/** No more per-slot camera dolly-in here (there used to be one, keyed off
 * the active card's slot) — Louis's explicit feedback was that a premium
 * pull's card getting physically bigger wasn't necessary, and it never
 * distinguished a Majestic/Legendary pull from a Common unless that pull
 * also happened to be foil. See cards/celebration-tier.ts and
 * PullCelebration.tsx for what replaced it: a glow behind the card instead
 * of a camera move. */
function targetForPhase(phase: string): [number, number, number] {
	if (phase === "tearing") return TEARING_CAMERA_POSITION;
	if (phase === "done") return DONE_CAMERA_POSITION;
	if (phase === "revealing") return REVEALING_CAMERA_POSITION;
	return IDLE_CAMERA_POSITION;
}

/** Scripted camera driven entirely by pack-opener store state — no OrbitControls,
 * this is a cinematic view the user never takes manual control of. */
export function CameraRig() {
	const { camera } = useThree();
	const phase = usePackOpenerStore((state) => state.phase);
	const target = useRef(new Vector3(...IDLE_CAMERA_POSITION));

	useFrame((_, delta) => {
		const [x, y, z] = targetForPhase(phase);
		const idleBobY = phase === "idle" ? Math.sin(Date.now() / 1500) * 0.03 : 0;
		target.current.set(x, y + idleBobY, z);
		camera.position.lerp(target.current, 1 - 0.001 ** delta);
		camera.lookAt(0, 0, 0);
	});

	return null;
}
