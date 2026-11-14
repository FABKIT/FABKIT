/** Easing curves shared by the scene animations. */

/** Fast start, gentle settle: for something arriving. */
export function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

/** Gentle start, accelerating away: for something leaving. */
export function easeInCubic(t: number): number {
	return t ** 3;
}
