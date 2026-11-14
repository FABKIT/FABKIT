import {
	CARD_SLIDE_DISTANCE,
	REVEAL_TRANSITION_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { easeInCubic } from "@fabkit/apps/pack-opener/lib/easing";

export interface OutgoingSlideTransform {
	y: number;
	z: number;
	rotationZ: number;
	visible: boolean;
}

/**
 * Where the just-revealed card sits in its slide off the top. Pure; applied
 * both as initial JSX props (so a new reveal's first frame already has the
 * outgoing card back on top of the incoming one) and in useFrame. At t = 0 it
 * is visible at y = 0, since taps can restart the slide mid-flight.
 */
export function outgoingSlideTransform(
	startedAt: number | null,
	now: number,
): OutgoingSlideTransform {
	const t =
		startedAt !== null
			? Math.min(Math.max((now - startedAt) / REVEAL_TRANSITION_MS, 0), 1)
			: 1;
	const eased = easeInCubic(t);
	return {
		y: eased * CARD_SLIDE_DISTANCE,
		// Small; `alwaysOnTop` (OutgoingCard.tsx) is what keeps this card in front.
		z: 0.03,
		rotationZ: eased * 0.07,
		visible: t < 1,
	};
}
