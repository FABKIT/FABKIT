/**
 * The easing curves this app's scene animations share.
 *
 * They were written out separately in four files, which is fine until two
 * of them drift apart and two animations that are meant to feel identical
 * quietly stop matching. Every timer in this scene reads its elapsed time
 * from one place already (the store's own timestamps, see
 * stores/pack-opener.ts); the shape of the curve belongs in one place for
 * the same reason.
 */

/** Fast start, gentle settle. For something arriving and coming to rest:
 * the pack's tear, the card's arrival, the celebration glow blooming in. */
export function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

/** Gentle start, accelerating away. For something leaving: the revealed
 * card sliding up off the stack. */
export function easeInCubic(t: number): number {
	return t ** 3;
}
