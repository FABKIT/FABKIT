import { CameraRig } from "@fabkit/apps/pack-opener/components/scene/CameraRig";
import { CardStack3D } from "@fabkit/apps/pack-opener/components/scene/CardStack3D";
import { PackMesh } from "@fabkit/apps/pack-opener/components/scene/PackMesh";
import { IDLE_CAMERA_POSITION } from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

export function PackOpenerCanvas() {
	const phase = usePackOpenerStore((state) => state.phase);

	return (
		<Canvas
			camera={{ position: IDLE_CAMERA_POSITION, fov: 35 }}
			// Capped from [1, 2] — see the execution plan, section 5,
			// performance fix 6. Full device pixel ratio on a high-DPI screen
			// is up to 4x the pixels for a modest sharpness gain on this
			// scene; capping at 1.5x keeps weaker/older GPUs smoother while
			// only slightly softening the sharpest screens.
			dpr={[1, 1.5]}
		>
			<Suspense fallback={null}>
				<ambientLight intensity={0.6} />
				<directionalLight position={[3, 4, 5]} intensity={1.2} />
				<Environment preset="studio" />
				<CameraRig />
				{(phase === "idle" || phase === "tearing") && <PackMesh />}
				{(phase === "revealing" || phase === "done") && <CardStack3D />}
			</Suspense>
		</Canvas>
	);
}
