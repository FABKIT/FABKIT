import {
	CARD_SLIDE_DISTANCE,
	REVEAL_TRANSITION_MS,
} from "@fabkit/apps/pack-opener/config/scene";

export interface OutgoingSlideTransform {
	y: number;
	z: number;
	rotationZ: number;
	visible: boolean;
}

function easeInCubic(t: number): number {
	return t ** 3;
}

/**
 * Where the just-revealed card sits in its slide off the top, at a given
 * moment.
 *
 * Pure, and the single definition of that transform, because it is applied
 * in two places that must agree: the group's JSX props during render, and
 * again every frame in useFrame. This is the same shape as
 * revealIntro.ts, and for the same underlying reason.
 *
 * That reason, concretely: this group is reused for every card in a pack,
 * so it arrives at each new reveal still holding the END of the previous
 * slide, pushed off the top of the frame and hidden. React swaps the new
 * card in during commit, but nothing corrects the transform until the next
 * frame callback, and the canvas can paint in between. The card underneath
 * is then briefly visible uncovered, which is the flash-through of the
 * next card that shows on a fast run of taps. Computing this during render
 * and passing it as props means the very first painted frame of a new
 * reveal already has the outgoing card back at its start pose, covering
 * the card below it.
 *
 * At t = 0 this deliberately returns `visible: true` at y = 0: the moment a
 * reveal begins, the outgoing card must be exactly on top of the incoming
 * one. Taps can come faster than REVEAL_TRANSITION_MS (ADVANCE_DEBOUNCE_MS
 * is far shorter), so a new slide routinely starts while the previous one
 * is still in flight, and every one of those starts has to begin from
 * cover rather than from wherever the last slide had reached.
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
		// Small on purpose, and not what keeps this card in front: see
		// OutgoingCard.tsx on why `alwaysOnTop` does that job instead.
		z: 0.03,
		rotationZ: eased * 0.07,
		visible: t < 1,
	};
}
