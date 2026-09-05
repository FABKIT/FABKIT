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
		<Canvas camera={{ position: IDLE_CAMERA_POSITION, fov: 35 }} dpr={[1, 2]}>
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
