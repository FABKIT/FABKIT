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
	CARD_TILT_EASE,
	PACK_HEIGHT,
	PACK_SEAL_HEIGHT,
	PACK_TILT_MAX_DEG,
	PACK_WIDTH,
	TEAR_DURATION_MS,
	TEAR_START_DELAY_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group, Mesh } from "three";

const MAX_TILT_RAD = (PACK_TILT_MAX_DEG * Math.PI) / 180;

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

const BODY_HEIGHT = PACK_HEIGHT - PACK_SEAL_HEIGHT;
// Body's bottom edge sits at -PACK_HEIGHT/2, seal's top edge at +PACK_HEIGHT/2,
// with the seal occupying the top PACK_SEAL_HEIGHT strip of the pack.
const BODY_CENTER_Y = -PACK_SEAL_HEIGHT / 2;
const SEAL_CENTER_Y = PACK_HEIGHT / 2 - PACK_SEAL_HEIGHT / 2;

// alphaTest: real pack art from LSS's product shots is a cut-out — the
// pack against transparency, with rounded corners. Without this those
// pixels paint as near-black fringes around the pack, which reads as a
// dark halo on a light background. A hard cutout keeps the material in
// the opaque queue, same reasoning as the cards (see Card3D.tsx).
//
// The rest of these numbers were tuned down hard once real artwork
// replaced the flat canvas mock. A product shot is a PHOTOGRAPH: the foil
// pouch's own sheen, its highlights and its creases are already painted
// into the pixels. Laying this scene's directional light and studio
// environment on top of that at metalness 0.55 / clearcoat 1 added a
// second, fake highlight that swept across the printed art and read as a
// vague glow sitting on the pack. Same principle the card faces settled
// on for the same reason (see this app's CLAUDE.md, "Rendering"): art is
// shown true-to-source rather than re-lit. A little sheen is kept
// deliberately, not removed altogether, because the pack IS foil and the
// pointer tilt below needs something to catch.
const BODY_MATERIAL_PROPS = {
	metalness: 0.05,
	roughness: 0.62,
	clearcoat: 0.18,
	clearcoatRoughness: 0.45,
	envMapIntensity: 0.22,
	alphaTest: 0.5,
} as const;
const SEAL_MATERIAL_PROPS = {
	metalness: 0.08,
	roughness: 0.55,
	clearcoat: 0.22,
	clearcoatRoughness: 0.4,
	envMapIntensity: 0.25,
	alphaTest: 0.5,
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
	const reducedMotion = usePrefersReducedMotion();

	const body = useRef<Mesh>(null);
	const seal = useRef<Mesh>(null);
	const group = useRef<Group>(null);
	const tilt = useRef({ x: 0, y: 0 });
	// Gates the sparkle burst so it fires with the rip rather than during
	// the hold before it. Keyed on phaseStartedAt as well as phase so every
	// new pack restarts the hold, not just the first one.
	const [tearStarted, setTearStarted] = useState(false);

	useEffect(() => {
		setTearStarted(false);
		if (phase !== "tearing" || phaseStartedAt === null) return;
		// Derived from the store's own timestamp rather than a flat delay, so
		// a remount partway through a tear picks up where that tear actually
		// is instead of restarting the hold.
		const remaining = phaseStartedAt + TEAR_START_DELAY_MS - Date.now();
		if (remaining <= 0) {
			setTearStarted(true);
			return;
		}
		const timer = setTimeout(() => setTearStarted(true), remaining);
		return () => clearTimeout(timer);
	}, [phase, phaseStartedAt]);

	useFrame((state) => {
		if (!body.current || !seal.current || !group.current) return;

		// The pack holds closed for TEAR_START_DELAY_MS before the seal moves
		// at all, so the rip lands after the camera has settled into the
		// tearing shot rather than under a moving one — see that constant's
		// own comment in config/scene.ts.
		const elapsed =
			phase === "tearing" && phaseStartedAt !== null
				? Date.now() - phaseStartedAt - TEAR_START_DELAY_MS
				: 0;
		const t =
			elapsed > 0 ? easeOutCubic(Math.min(elapsed / TEAR_DURATION_MS, 1)) : 0;

		// Pointer tilt, same idea and same easing as the cards (Card3D.tsx) —
		// a real foil pouch shifts its sheen as you turn it, and the pack now
		// carries real printed foil art worth turning. It lives on the outer
		// group rather than on the body mesh so it composes with the tear's
		// own body.rotation.x below instead of overwriting it, and it eases
		// back to flat during the tear so it never competes with that
		// choreography.
		const wantsTilt = !reducedMotion && phase === "idle";
		const targetX = wantsTilt ? Math.max(-1, Math.min(1, state.pointer.x)) : 0;
		const targetY = wantsTilt ? Math.max(-1, Math.min(1, state.pointer.y)) : 0;
		tilt.current.x += (targetX - tilt.current.x) * CARD_TILT_EASE;
		tilt.current.y += (targetY - tilt.current.y) * CARD_TILT_EASE;
		group.current.rotation.x = -tilt.current.y * MAX_TILT_RAD;
		group.current.rotation.y = tilt.current.x * MAX_TILT_RAD;

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
			{phase === "tearing" && tearStarted && (
				<TearBurst position={[0, BODY_HEIGHT / 2 + BODY_CENTER_Y, 0.1]} />
			)}
		</group>
	);
}
