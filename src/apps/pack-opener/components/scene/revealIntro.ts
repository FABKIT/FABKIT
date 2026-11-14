import {
	REVEAL_INTRO_MS,
	REVEAL_INTRO_START_SCALE,
	REVEAL_INTRO_START_Z,
} from "@fabkit/apps/pack-opener/config/scene";
import { easeOutCubic } from "@fabkit/apps/pack-opener/lib/easing";

export interface RevealIntroTransform {
	scale: number;
	z: number;
}

const AT_REST: RevealIntroTransform = { scale: 1, z: 0 };

/**
 * Arrival-animation transform for the card stack. Pure; applied both as
 * initial JSX props (so the first painted frame is right) and in useFrame.
 * Takes startedAt so a remount resumes mid-animation. A null start or reduced
 * motion means at rest.
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
