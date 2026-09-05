import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { FoilMaterialImpl } from "@fabkit/apps/pack-opener/components/scene/materials/foilMaterial";
import { useCardTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useCardTexture";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import type { Texture } from "three";

export const CARD_WIDTH = 1.2;
export const CARD_HEIGHT = CARD_WIDTH * (628 / 450);

interface CardFaceMaterialProps {
	texture: Texture;
	isFoil: boolean;
	isMarvel: boolean;
}

/** Plain vs. holographic foilMaterial for a resolved texture — shared by
 * both the real-image and mock-canvas rendering paths below. */
function CardFaceMaterial({
	texture,
	isFoil,
	isMarvel,
}: CardFaceMaterialProps) {
	const foilMaterial = useMemo(() => new FoilMaterialImpl(), []);

	useFrame((_, delta) => {
		if (!isFoil) return;
		foilMaterial.uTime += delta;
		foilMaterial.uBaseTexture = texture;
		foilMaterial.uIntensity = isMarvel ? 1 : 0.4;
	});

	// Unlit on purpose: a card's own image is meant to be viewed true-to-source
	// (like a photo), not lit as a 3D object — a lit meshStandardMaterial under
	// this scene's ambient + directional + studio-environment lighting washed
	// the art out. foilMaterial is a fully custom shader (no scene-light
	// uniforms), so it's unaffected either way.
	return isFoil ? (
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
}: {
	card: ResolvedCard;
	imageUrl: string;
}) {
	const texture = useTexture(imageUrl);
	return (
		<CardFaceMaterial
			texture={texture}
			isFoil={card.foil || card.marvel}
			isMarvel={card.marvel}
		/>
	);
}

/** Fallback when a card has no real image (dataset unavailable) — the
 * canvas-drawn placeholder frame. */
function MockCardFace({ card }: { card: ResolvedCard }) {
	const texture = useCardTexture(card);
	return (
		<CardFaceMaterial
			texture={texture}
			isFoil={card.foil || card.marvel}
			isMarvel={card.marvel}
		/>
	);
}

interface Card3DProps {
	card: ResolvedCard;
	onClick?: () => void;
}

/** A single face-up card. Always static in place — no flip, no rotation.
 * Reveals happen by sliding the previous card away (see OutgoingCard), not
 * by turning this one over. */
export function Card3D({ card, onClick }: Card3DProps) {
	return (
		<mesh onClick={onClick}>
			<planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
			{card.imageUrl !== null ? (
				<RealCardFace card={card} imageUrl={card.imageUrl} />
			) : (
				<MockCardFace card={card} />
			)}
		</mesh>
	);
}
