import {
	CAMERA_PUNCH_BY_SLOT,
	DONE_CAMERA_POSITION,
	IDLE_CAMERA_POSITION,
	REVEALING_CAMERA_POSITION,
	TEARING_CAMERA_POSITION,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";

function targetForPhase(
	phase: string,
	pack: ReturnType<typeof usePackOpenerStore.getState>["pack"],
	revealIndex: number,
): [number, number, number] {
	if (phase === "tearing") return TEARING_CAMERA_POSITION;
	if (phase === "done") return DONE_CAMERA_POSITION;
	if (phase === "revealing" && pack) {
		const activeCard = pack[revealIndex];
		const punch = activeCard ? (CAMERA_PUNCH_BY_SLOT[activeCard.slot] ?? 0) : 0;
		const [x, y, z] = REVEALING_CAMERA_POSITION;
		return [x, y, z - punch];
	}
	return IDLE_CAMERA_POSITION;
}

/** Scripted camera driven entirely by pack-opener store state — no OrbitControls,
 * this is a cinematic view the user never takes manual control of. */
export function CameraRig() {
	const { camera } = useThree();
	const phase = usePackOpenerStore((state) => state.phase);
	const pack = usePackOpenerStore((state) => state.pack);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const target = useRef(new Vector3(...IDLE_CAMERA_POSITION));

	useFrame((_, delta) => {
		const [x, y, z] = targetForPhase(phase, pack, revealIndex);
		const idleBobY = phase === "idle" ? Math.sin(Date.now() / 1500) * 0.03 : 0;
		target.current.set(x, y + idleBobY, z);
		camera.position.lerp(target.current, 1 - 0.001 ** delta);
		camera.lookAt(0, 0, 0);
	});

	return null;
}
