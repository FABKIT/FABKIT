import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { FoilMaterialImpl } from "@fabkit/apps/pack-opener/components/scene/materials/foilMaterial";
import { useCardTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useCardTexture";
import {
	CARD_TILT_EASE,
	CARD_TILT_MAX_DEG,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import type { Group, Texture } from "three";

export const CARD_WIDTH = 1.2;
export const CARD_HEIGHT = CARD_WIDTH * (628 / 450);

const MAX_TILT_RAD = (CARD_TILT_MAX_DEG * Math.PI) / 180;

/** The light direction the foil shader uses when prefers-reduced-motion is
 * on. Tilt itself is fully disabled then (section 3.4: "no tilt"), but a
 * light direction of (0, 0) reads as *no* foil effect at all — real foil
 * is "invisible head-on" — so this holds a fixed, gentle off-angle
 * instead: "a fixed, gentle sheen rather than an animated one." */
const REDUCED_MOTION_LIGHT_DIR = { x: 0.35, y: 0.25 };

const TREATMENT_CODE: Record<ResolvedCard["treatment"], number> = {
	standard: 0,
	rainbow: 1,
	cold: 2,
	"gold-cold": 3,
};

type LightDirRef = RefObject<{ x: number; y: number }>;

interface CardFaceMaterialProps {
	texture: Texture;
	treatment: ResolvedCard["treatment"];
	isMarvel: boolean;
	/** Live tilt/light-direction offset (-1..1 each axis), read imperatively
	 * every frame — owned by Card3D's own useFrame below, which keeps the
	 * tilt group's rotation and the shader's light direction in agreement. */
	lightDirRef: LightDirRef;
}

/** Plain vs. holographic foilMaterial for a resolved texture — shared by
 * both the real-image and mock-canvas rendering paths below. */
function CardFaceMaterial({
	texture,
	treatment,
	isMarvel,
	lightDirRef,
}: CardFaceMaterialProps) {
	const foilMaterial = useMemo(() => new FoilMaterialImpl(), []);

	useFrame(() => {
		if (treatment === "standard") return;
		foilMaterial.uBaseTexture = texture;
		foilMaterial.uTreatment = TREATMENT_CODE[treatment];
		foilMaterial.uIntensity = isMarvel ? 1 : 0.4;
		foilMaterial.uLightDir = [lightDirRef.current.x, lightDirRef.current.y];
	});

	// Unlit on purpose: a card's own image is meant to be viewed true-to-source
	// (like a photo), not lit as a 3D object — a lit meshStandardMaterial under
	// this scene's ambient + directional + studio-environment lighting washed
	// the art out. foilMaterial is a fully custom shader (no scene-light
	// uniforms), so it's unaffected either way.
	return treatment !== "standard" ? (
		<primitive object={foilMaterial} attach="material" />
	) : (
		<meshBasicMaterial map={texture} />
	);
}

/** A real FAB card's own image already is the full rendered card face — no
 * canvas frame-drawing needed, just load it as a texture (preloaded ahead
 * of time by the store when a pack opens, see stores/pack-opener.ts, so
 * this shouldn't actually suspend mid-reveal). */
function RealCardFace({
	card,
	imageUrl,
	lightDirRef,
}: {
	card: ResolvedCard;
	imageUrl: string;
	lightDirRef: LightDirRef;
}) {
	const texture = useTexture(imageUrl);
	return (
		<CardFaceMaterial
			texture={texture}
			treatment={card.treatment}
			isMarvel={card.rarity === "marvel"}
			lightDirRef={lightDirRef}
		/>
	);
}

/** Fallback when a card has no real image (dataset unavailable) — the
 * canvas-drawn placeholder frame. */
function MockCardFace({
	card,
	lightDirRef,
}: {
	card: ResolvedCard;
	lightDirRef: LightDirRef;
}) {
	const texture = useCardTexture(card);
	return (
		<CardFaceMaterial
			texture={texture}
			treatment={card.treatment}
			isMarvel={card.rarity === "marvel"}
			lightDirRef={lightDirRef}
		/>
	);
}

interface Card3DProps {
	card: ResolvedCard;
	onClick?: () => void;
	/** False for the outgoing (sliding-away) card in OutgoingCard.tsx — not
	 * interactive, so it tracks no pointer and stays flat/at-rest. Tilt
	 * lives entirely inside this component (the group below); the reveal
	 * slide stays on OutgoingCard's own separate group, per the execution
	 * plan section 5.3 — the two never touch the same transform. */
	interactive?: boolean;
}

/** A single face-up card. Always static in place — no flip, no rotation as
 * part of the reveal. What DOES rotate here is the tilt: pointer position
 * over the canvas maps to a small tilt on this group (section 3.4), which
 * also drives the foil shader's light direction (section 3.3) so the two
 * are one piece of work, not two. Reveals still happen by sliding the
 * previous card away (see OutgoingCard), never by turning this one over. */
export function Card3D({ card, onClick, interactive = true }: Card3DProps) {
	const group = useRef<Group>(null);
	const lightDir = useRef({ x: 0, y: 0 });
	const reducedMotion = usePrefersReducedMotion();

	useFrame((state) => {
		if (reducedMotion) {
			lightDir.current.x = REDUCED_MOTION_LIGHT_DIR.x;
			lightDir.current.y = REDUCED_MOTION_LIGHT_DIR.y;
		} else {
			const targetX = interactive
				? Math.max(-1, Math.min(1, state.pointer.x))
				: 0;
			const targetY = interactive
				? Math.max(-1, Math.min(1, state.pointer.y))
				: 0;
			lightDir.current.x += (targetX - lightDir.current.x) * CARD_TILT_EASE;
			lightDir.current.y += (targetY - lightDir.current.y) * CARD_TILT_EASE;
		}

		if (!group.current) return;
		if (reducedMotion) {
			group.current.rotation.x = 0;
			group.current.rotation.y = 0;
		} else {
			// Tipping the card's near-right edge away from a pointer on the
			// right (and its top edge away from a pointer above) is what
			// reads as "tilting it under a lamp" rather than fighting the
			// pointer — verified on screen, not just by sign algebra.
			group.current.rotation.x = -lightDir.current.y * MAX_TILT_RAD;
			group.current.rotation.y = lightDir.current.x * MAX_TILT_RAD;
		}
	});

	return (
		<group ref={group}>
			<mesh onClick={onClick}>
				<planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
				{card.imageUrl !== null ? (
					<RealCardFace
						card={card}
						imageUrl={card.imageUrl}
						lightDirRef={lightDir}
					/>
				) : (
					<MockCardFace card={card} lightDirRef={lightDir} />
				)}
			</mesh>
		</group>
	);
}
