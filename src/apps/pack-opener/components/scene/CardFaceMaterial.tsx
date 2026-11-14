import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { FoilMaterialImpl } from "@fabkit/apps/pack-opener/components/scene/materials/foilMaterial";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo } from "react";
import type { Texture } from "three";

/** Drift-cycle instant held under prefers-reduced-motion; puts the band on the card. */
const REDUCED_MOTION_FOIL_TIME = 2;

/** How much light the foil returns; a Marvel gets more. */
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

/** Built here so a plain card never builds a shader material; disposed here
 * because r3f never disposes a primitive. Texture and treatment go through
 * props so they are set on the first painted frame (an unset sampler reads
 * alpha 0 and would flash the card underneath). */
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
		// Wall-clock seconds: an ambient property that must not restart with the reveal timers.
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

/** Plain or foil for a resolved texture. Plain uses alphaTest (opaque queue);
 * unlit so art reads true to source. */
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
