import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { FoilMaterialImpl } from "@fabkit/apps/pack-opener/components/scene/materials/foilMaterial";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo } from "react";
import type { Texture } from "three";

/** The instant of the cold foil's drift cycle held still under
 * prefers-reduced-motion (foilMaterial.ts normally sweeps the reflection across
 * the card on its own). Chosen because it puts the band ON the card rather than
 * just off its edge, so a visitor who asked for no animation still sees a foil
 * rather than a plain card. */
const REDUCED_MOTION_FOIL_TIME = 2;

/** How much light the foil returns, not how much of the art to replace: see
 * foilMaterial.ts, where both branches only ever brighten. A Marvel gets more
 * because it's a card people are meant to notice across a room. */
const FOIL_INTENSITY = 0.45;
const MARVEL_FOIL_INTENSITY = 0.7;

const TREATMENT_CODE: Record<
	Exclude<ResolvedCard["treatment"], "standard">,
	number
> = {
	rainbow: 1,
	cold: 2,
	"gold-cold": 3,
};

export type LightDirRef = RefObject<{ x: number; y: number }>;

interface CardFaceMaterialProps {
	texture: Texture;
	treatment: ResolvedCard["treatment"];
	isMarvel: boolean;
	/** Live tilt offset (-1..1 each axis), read every frame. Owned by
	 * useCardTilt, which keeps the card's rotation and this in agreement. */
	lightDirRef: LightDirRef;
	/** Turns off depth testing and writing so this always paints over whatever
	 * is behind it, regardless of z. See Card3D's prop of the same name. */
	alwaysOnTop: boolean;
}

/** Created here rather than in CardFaceMaterial so a plain card never builds a
 * shader material, and disposed here because r3f never disposes a primitive.
 *
 * The texture, treatment and intensity go through props rather than the frame
 * callback so they are already set on the very first painted frame: this
 * material can mount on the outgoing card mid-reveal, and an unset sampler
 * reads as alpha 0, which the shader discards, flashing the card underneath. */
function FoilCardMaterial({
	texture,
	treatment,
	isMarvel,
	lightDirRef,
	alwaysOnTop,
}: CardFaceMaterialProps & {
	treatment: keyof typeof TREATMENT_CODE;
}) {
	const material = useMemo(() => new FoilMaterialImpl(), []);
	const reducedMotion = usePrefersReducedMotion();

	useEffect(() => () => material.dispose(), [material]);

	useFrame((state) => {
		material.uLightDir[0] = lightDirRef.current.x;
		material.uLightDir[1] = lightDirRef.current.y;
		// Wall-clock seconds, and the one timer in this scene that deliberately
		// does NOT read off the store's phaseStartedAt (see the app's CLAUDE.md).
		// That rule exists so the tear and the reveal can never restart or
		// disagree with each other; this is an ambient surface property of a
		// card rather than a step in that sequence, it must not restart when a
		// new card becomes active, and it has to keep moving while nothing else
		// is happening at all.
		material.uTime = reducedMotion
			? REDUCED_MOTION_FOIL_TIME
			: state.clock.elapsedTime;
	});

	return (
		<primitive
			object={material}
			attach="material"
			uBaseTexture={texture}
			uTreatment={TREATMENT_CODE[treatment]}
			uIntensity={isMarvel ? MARVEL_FOIL_INTENSITY : FOIL_INTENSITY}
			depthTest={!alwaysOnTop}
			depthWrite={!alwaysOnTop}
		/>
	);
}

/** Plain or foil for a resolved texture.
 *
 * Every real card image has transparent rounded corners baked into its alpha
 * channel. alphaTest is what makes them round on screen, since
 * meshBasicMaterial otherwise ignores alpha and paints the full rectangle, and
 * as a hard per-pixel cutoff rather than blended transparency it keeps the card
 * in the opaque render queue. foilMaterial.ts has its own explicit `discard`
 * for the same reason.
 *
 * Unlit on purpose: a card's image is meant to read true-to-source, like a
 * photo, not as a lit 3D object (see "Rendering" in the app's CLAUDE.md). */
export function CardFaceMaterial({
	texture,
	treatment,
	isMarvel,
	lightDirRef,
	alwaysOnTop,
}: CardFaceMaterialProps) {
	if (treatment !== "standard") {
		return (
			<FoilCardMaterial
				texture={texture}
				treatment={treatment}
				isMarvel={isMarvel}
				lightDirRef={lightDirRef}
				alwaysOnTop={alwaysOnTop}
			/>
		);
	}
	return (
		<meshBasicMaterial
			map={texture}
			alphaTest={0.5}
			depthTest={!alwaysOnTop}
			depthWrite={!alwaysOnTop}
		/>
	);
}
