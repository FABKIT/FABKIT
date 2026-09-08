import { TearBurst } from "@fabkit/apps/pack-opener/components/scene/TearBurst";
import {
	usePackBodyTexture,
	usePackSealTexture,
} from "@fabkit/apps/pack-opener/components/scene/textures/usePackTexture";
import {
	useRealPackBodyTexture,
	useRealPackSealTexture,
} from "@fabkit/apps/pack-opener/components/scene/textures/useRealPackTexture";
import {
	PACK_HEIGHT,
	PACK_SEAL_HEIGHT,
	PACK_WIDTH,
	TEAR_DURATION_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

const BODY_HEIGHT = PACK_HEIGHT - PACK_SEAL_HEIGHT;
// Body's bottom edge sits at -PACK_HEIGHT/2, seal's top edge at +PACK_HEIGHT/2,
// with the seal occupying the top PACK_SEAL_HEIGHT strip of the pack.
const BODY_CENTER_Y = -PACK_SEAL_HEIGHT / 2;
const SEAL_CENTER_Y = PACK_HEIGHT / 2 - PACK_SEAL_HEIGHT / 2;

const BODY_MATERIAL_PROPS = {
	metalness: 0.55,
	roughness: 0.3,
	clearcoat: 1,
	clearcoatRoughness: 0.15,
} as const;
const SEAL_MATERIAL_PROPS = {
	metalness: 0.6,
	roughness: 0.25,
	clearcoat: 1,
	clearcoatRoughness: 0.1,
} as const;

/** Real vs. mock texture source, branched as separate mounted components
 * (not a conditional hook call within one component) — same pattern
 * Card3D.tsx uses for RealCardFace/MockCardFace. `url` is preloaded by the
 * store's selectSet()/initializeSetArt() before this ever mounts, so this
 * shouldn't actually suspend in the common case. */
function RealPackBodyMaterial({ url }: { url: string }) {
	const texture = useRealPackBodyTexture(url);
	return <meshPhysicalMaterial map={texture} {...BODY_MATERIAL_PROPS} />;
}
function MockPackBodyMaterial() {
	const texture = usePackBodyTexture();
	return <meshPhysicalMaterial map={texture} {...BODY_MATERIAL_PROPS} />;
}
function PackBodyMaterial({ packArtUrl }: { packArtUrl: string | null }) {
	return packArtUrl ? (
		<RealPackBodyMaterial url={packArtUrl} />
	) : (
		<MockPackBodyMaterial />
	);
}

function RealPackSealMaterial({ url }: { url: string }) {
	const texture = useRealPackSealTexture(url);
	return <meshPhysicalMaterial map={texture} {...SEAL_MATERIAL_PROPS} />;
}
function MockPackSealMaterial() {
	const texture = usePackSealTexture();
	return <meshPhysicalMaterial map={texture} {...SEAL_MATERIAL_PROPS} />;
}
function PackSealMaterial({ packArtUrl }: { packArtUrl: string | null }) {
	return packArtUrl ? (
		<RealPackSealMaterial url={packArtUrl} />
	) : (
		<MockPackSealMaterial />
	);
}

/** The closed booster pack: a portrait foil pouch (matching real FAB pack
 * proportions, roughly 1:2 width:height) that opens by tearing off a thin
 * top seal strip — not splitting the whole pack in half. Click/tap while
 * idle starts the tear via the store's openPack action. */
export function PackMesh() {
	const phase = usePackOpenerStore((state) => state.phase);
	const phaseStartedAt = usePackOpenerStore((state) => state.phaseStartedAt);
	const openPack = usePackOpenerStore((state) => state.openPack);
	const packArtUrl = usePackOpenerStore((state) => state.packArtUrl);

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
				<PackBodyMaterial packArtUrl={packArtUrl} />
			</mesh>
			<mesh
				ref={seal}
				position={[0, SEAL_CENTER_Y, 0]}
				onClick={() => phase === "idle" && openPack()}
			>
				<boxGeometry args={[PACK_WIDTH, PACK_SEAL_HEIGHT, 0.1]} />
				<PackSealMaterial packArtUrl={packArtUrl} />
			</mesh>
			{phase === "tearing" && (
				<TearBurst position={[0, BODY_HEIGHT / 2 + BODY_CENTER_Y, 0.1]} />
			)}
		</group>
	);
}
