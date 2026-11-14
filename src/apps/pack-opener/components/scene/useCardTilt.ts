import {
	applyTilt,
	easeTiltTowardPointer,
} from "@fabkit/apps/pack-opener/components/scene/pointerTilt";
import { CARD_TILT_MAX_DEG } from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

const MAX_TILT_RAD = (CARD_TILT_MAX_DEG * Math.PI) / 180;

/** The light direction the foil shader uses under prefers-reduced-motion. Tilt
 * itself is disabled then, but a light direction of (0, 0) reads as no foil at
 * all, since real foil is invisible head-on, so this holds a fixed, gentle
 * off-angle: a still sheen rather than an animated one. */
const REDUCED_MOTION_LIGHT_DIR = { x: 0.35, y: 0.25 };

/** Pointer position maps to a small tilt on the returned group, and the same
 * value is the foil shader's light direction. One useFrame owns both so the
 * card's rotation and its reflection can never disagree. */
export function useCardTilt(interactive: boolean) {
	const group = useRef<Group>(null);
	const lightDir = useRef({ x: 0, y: 0 });
	const reducedMotion = usePrefersReducedMotion();

	useFrame((state) => {
		if (reducedMotion) {
			lightDir.current.x = REDUCED_MOTION_LIGHT_DIR.x;
			lightDir.current.y = REDUCED_MOTION_LIGHT_DIR.y;
			group.current?.rotation.set(0, 0, 0);
			return;
		}
		easeTiltTowardPointer(lightDir.current, state.pointer, interactive);
		if (group.current) {
			applyTilt(group.current, lightDir.current, MAX_TILT_RAD);
		}
	});

	return { group, lightDir };
}
