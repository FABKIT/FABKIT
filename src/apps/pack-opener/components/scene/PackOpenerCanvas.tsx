import { CameraRig } from "@fabkit/apps/pack-opener/components/scene/CameraRig";
import { CardStack3D } from "@fabkit/apps/pack-opener/components/scene/CardStack3D";
import { PackMesh } from "@fabkit/apps/pack-opener/components/scene/PackMesh";
import { IDLE_CAMERA_POSITION } from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { Canvas } from "@react-three/fiber";

/** No lights, and no drei <Environment>, on purpose. Every material in this
 * scene is unlit: the card faces, the foil shader, the celebration glow, drei's
 * Sparkles and the pack. Nothing was consuming the lights or the environment map
 * except the pack, where they were actively harmful, adding a computed highlight
 * over artwork that already has its own (see PackMaterial.tsx).
 *
 * Removing <Environment> also removed an HDRI download at runtime, and with it a
 * measured ~300ms where this canvas rendered nothing at all.
 *
 * No Suspense boundary either, because nothing in here suspends: every image
 * goes through useSafeTexture, which reports loading rather than throwing a
 * promise. A boundary around the whole scene used to tear down and rebuild both
 * the pack and the cards whenever either one suspended, restarting whatever
 * animation had just begun. */
export function PackOpenerCanvas() {
	const phase = usePackOpenerStore((state) => state.phase);

	return (
		<Canvas
			camera={{ position: IDLE_CAMERA_POSITION, fov: 35 }}
			// Full device pixel ratio on a high-DPI screen is up to 4x the pixels
			// for a modest sharpness gain on this scene. Capping at 1.5x keeps
			// weaker and older GPUs smoother while only slightly softening the
			// sharpest screens.
			dpr={[1, 1.5]}
		>
			<CameraRig />
			{(phase === "idle" || phase === "tearing") && <PackMesh />}
			{(phase === "revealing" || phase === "done") && <CardStack3D />}
		</Canvas>
	);
}
