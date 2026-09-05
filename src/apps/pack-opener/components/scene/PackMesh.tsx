import { TearBurst } from "@fabkit/apps/pack-opener/components/scene/TearBurst";
import {
	usePackBodyTexture,
	usePackSealTexture,
} from "@fabkit/apps/pack-opener/components/scene/textures/usePackTexture";
import { TEAR_DURATION_MS } from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

const PACK_WIDTH = 1.05;
const PACK_HEIGHT = 2.0;
const SEAL_HEIGHT = 0.16;
const BODY_HEIGHT = PACK_HEIGHT - SEAL_HEIGHT;
// Body's bottom edge sits at -PACK_HEIGHT/2, seal's top edge at +PACK_HEIGHT/2,
// with the seal occupying the top SEAL_HEIGHT strip of the pack.
const BODY_CENTER_Y = -SEAL_HEIGHT / 2;
const SEAL_CENTER_Y = PACK_HEIGHT / 2 - SEAL_HEIGHT / 2;

/** The closed booster pack: a portrait foil pouch (matching real FAB pack
 * proportions, roughly 1:2 width:height) that opens by tearing off a thin
 * top seal strip — not splitting the whole pack in half. Click/tap while
 * idle starts the tear via the store's openPack action. */
export function PackMesh() {
	const phase = usePackOpenerStore((state) => state.phase);
	const phaseStartedAt = usePackOpenerStore((state) => state.phaseStartedAt);
	const openPack = usePackOpenerStore((state) => state.openPack);

	const bodyTexture = usePackBodyTexture();
	const sealTexture = usePackSealTexture();

	const body = useRef<Mesh>(null);
	const seal = useRef<Mesh>(null);
	const group = useRef<Group>(null);

	useFrame(() => {
		if (!body.current || !seal.current || !group.current) return;

		const t =
			phase === "tearing" && phaseStartedAt !== null
				? easeOutCubic(
						Math.min((Date.now() - phaseStartedAt) / TEAR_DURATION_MS, 1),
					)
				: 0;

		seal.current.position.y = SEAL_CENTER_Y + t * 1.9;
		seal.current.position.x = t * 0.35;
		seal.current.rotation.z = t * (Math.PI / 2.4);
		body.current.rotation.x = -t * 0.08;

		group.current.visible = phase === "idle" || phase === "tearing";
	});

	return (
		<group ref={group}>
			<mesh
				ref={body}
				position={[0, BODY_CENTER_Y, 0]}
				onClick={() => phase === "idle" && openPack()}
			>
				<boxGeometry args={[PACK_WIDTH, BODY_HEIGHT, 0.09]} />
				<meshPhysicalMaterial
					map={bodyTexture}
					metalness={0.55}
					roughness={0.3}
					clearcoat={1}
					clearcoatRoughness={0.15}
				/>
			</mesh>
			<mesh
				ref={seal}
				position={[0, SEAL_CENTER_Y, 0]}
				onClick={() => phase === "idle" && openPack()}
			>
				<boxGeometry args={[PACK_WIDTH, SEAL_HEIGHT, 0.1]} />
				<meshPhysicalMaterial
					map={sealTexture}
					metalness={0.6}
					roughness={0.25}
					clearcoat={1}
					clearcoatRoughness={0.1}
				/>
			</mesh>
			{phase === "tearing" && (
				<TearBurst position={[0, BODY_HEIGHT / 2 + BODY_CENTER_Y, 0.1]} />
			)}
		</group>
	);
}
