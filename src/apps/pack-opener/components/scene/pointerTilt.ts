import { CARD_TILT_EASE } from "@fabkit/apps/pack-opener/config/scene";
import type { Object3D } from "three";

interface Tilt {
	x: number;
	y: number;
}

function clampToUnit(value: number): number {
	return Math.max(-1, Math.min(1, value));
}

/** Eases `tilt` toward the pointer, or back to flat when not `tracking`. Shared
 * by the cards and the closed pack so the two respond to the pointer alike. */
export function easeTiltTowardPointer(
	tilt: Tilt,
	pointer: Tilt,
	tracking: boolean,
): void {
	const targetX = tracking ? clampToUnit(pointer.x) : 0;
	const targetY = tracking ? clampToUnit(pointer.y) : 0;
	tilt.x += (targetX - tilt.x) * CARD_TILT_EASE;
	tilt.y += (targetY - tilt.y) * CARD_TILT_EASE;
}

/** Tipping the near-right edge away from a pointer on the right, and the top
 * edge away from a pointer above, is what reads as tilting something under a
 * lamp rather than fighting the pointer. Verified on screen, not just by sign
 * algebra. */
export function applyTilt(
	object: Object3D,
	tilt: Tilt,
	maxRadians: number,
): void {
	object.rotation.x = -tilt.y * maxRadians;
	object.rotation.y = tilt.x * maxRadians;
}
