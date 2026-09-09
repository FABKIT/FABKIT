import { CameraRig } from "@fabkit/apps/pack-opener/components/scene/CameraRig";
import { CardStack3D } from "@fabkit/apps/pack-opener/components/scene/CardStack3D";
import { PackMesh } from "@fabkit/apps/pack-opener/components/scene/PackMesh";
import { IDLE_CAMERA_POSITION } from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

/** No lights, and no drei <Environment>, on purpose. Every material in this
 * scene is now unlit: the card faces (Card3D.tsx), the foil shader, the
 * celebration glow, drei's Sparkles, and as of the pack going
 * meshBasicMaterial, the pack too. Nothing was consuming the ambient light,
 * the directional light or the studio environment map except the pack, and
 * on the pack they were actively harmful, adding a computed highlight over
 * artwork that already has its own (see PackMesh.tsx).
 *
 * Removing <Environment> also removes an HDRI download at runtime, and with
 * it a measured ~300ms where this canvas rendered nothing at all: the
 * environment map suspended, and with a single Suspense boundary wrapping
 * the whole scene, that blanked everything.
 *
 * Which is the other half of what changed here. The pack and the card stack
 * each get their OWN boundary now. A shared one meant that anything
 * suspending anywhere tore down and rebuilt the entire scene, so swapping
 * from the pack to the first card destroyed and remounted both branches,
 * restarting whatever animation had just begun. That read on screen as the
 * card (and the pack, on "open another pack") appearing, disappearing and
 * appearing again. The store-side fix for that is revealStartedAt (see
 * stores/pack-opener.ts); this is the structural half. */
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
			<CameraRig />
			{(phase === "idle" || phase === "tearing") && (
				<Suspense fallback={null}>
					<PackMesh />
				</Suspense>
			)}
			{(phase === "revealing" || phase === "done") && (
				<Suspense fallback={null}>
					<CardStack3D />
				</Suspense>
			)}
		</Canvas>
	);
}
