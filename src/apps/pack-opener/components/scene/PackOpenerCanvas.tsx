import { CameraRig } from "@fabkit/apps/pack-opener/components/scene/CameraRig";
import { CardStack3D } from "@fabkit/apps/pack-opener/components/scene/CardStack3D";
import { PackMesh } from "@fabkit/apps/pack-opener/components/scene/PackMesh";
import { IDLE_CAMERA_POSITION } from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { Canvas } from "@react-three/fiber";

/** Unlit scene: no lights, no <Environment>, no Suspense (useSafeTexture never throws). */
export function PackOpenerCanvas() {
	const phase = usePackOpenerStore((state) => state.phase);

	return (
		<Canvas
			camera={{ position: IDLE_CAMERA_POSITION, fov: 35 }}
			// Capped to keep weaker GPUs smooth.
			dpr={[1, 1.5]}
			// No tone mapping: art reads true to source and matches the foil shader.
			flat
		>
			<CameraRig />
			{(phase === "idle" || phase === "tearing") && <PackMesh />}
			{(phase === "revealing" || phase === "done") && <CardStack3D />}
		</Canvas>
	);
}
