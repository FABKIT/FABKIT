import {
	REVEAL_INTRO_MS,
	REVEAL_INTRO_START_SCALE,
	REVEAL_INTRO_START_Z,
} from "@fabkit/apps/pack-opener/config/scene";

export interface RevealIntroTransform {
	scale: number;
	z: number;
}

const AT_REST: RevealIntroTransform = { scale: 1, z: 0 };

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

/**
 * Where the card stack sits in its arrival animation at a given moment.
 *
 * Pure, and deliberately the ONLY definition of that transform, because it
 * has to be applied in two places that must agree exactly: as the group's
 * initial JSX props during render, and again every frame in useFrame.
 *
 * Both are needed. A newly mounted r3f subtree does not get its useFrame
 * callback until React has run effects, but the canvas keeps painting in
 * the meantime (CameraRig's own useFrame is already subscribed and drives
 * the loop). Measured on this scene, that left the card drawn at its full
 * resting size for two frames before the intro transform was applied at
 * all, at which point it snapped back to the start of the animation and
 * grew again. On screen that read as the card appearing, then being
 * replaced by a second copy that was the real one. Computing the transform
 * during render and passing it as props means the first painted frame is
 * already correct, whenever that frame happens to land.
 *
 * Taking `startedAt` rather than an elapsed time is what makes a remount
 * safe: the animation resumes wherever it actually is instead of replaying
 * (see stores/pack-opener.ts's revealStartedAt). A null start, or reduced
 * motion, means there is nothing to animate and the stack sits at rest.
 */
export function revealIntroTransform(
	startedAt: number | null,
	now: number,
	reducedMotion: boolean,
): RevealIntroTransform {
	if (reducedMotion || startedAt === null) return AT_REST;
	const t = Math.min(Math.max((now - startedAt) / REVEAL_INTRO_MS, 0), 1);
	if (t >= 1) return AT_REST;
	const eased = easeOutCubic(t);
	return {
		scale: REVEAL_INTRO_START_SCALE + (1 - REVEAL_INTRO_START_SCALE) * eased,
		z: REVEAL_INTRO_START_Z * (1 - eased),
	};
}
