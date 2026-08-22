/**
 * What a prefill link asked for that the card could not take, held for the
 * banner that tells the user about it.
 *
 * Deliberately not loader data: applying a link ends in a replace navigation
 * that strips the params, and that re-runs the loader against an empty search,
 * discarding whatever the first pass returned. A store outlives the second
 * pass; loader data does not.
 */

import { create } from "zustand";
import type { IgnoredParam } from "./vocabulary.ts";

interface PrefillNoticeState {
	ignored: IgnoredParam[];
}

const usePrefillNoticeStore = create<PrefillNoticeState>(() => ({
	ignored: [],
}));

/**
 * Whether the notice belongs to a link the route is still in the middle of
 * applying. The strip navigation runs the loader a second time, and that pass
 * must not throw away what the first one just recorded.
 */
let isAwaitingStrip = false;

export const setPrefillNotice = (ignored: IgnoredParam[]): void => {
	isAwaitingStrip = true;
	usePrefillNoticeStore.setState({ ignored });
};

export const dismissPrefillNotice = (): void => {
	isAwaitingStrip = false;
	usePrefillNoticeStore.setState({ ignored: [] });
};

/**
 * Called when the route is entered with no params. That is either the strip
 * navigation, which keeps the notice, or the user arriving without a link at
 * all, in which case the notice describes a link that is no longer on screen
 * and goes.
 */
export const dismissStalePrefillNotice = (): void => {
	if (isAwaitingStrip) {
		isAwaitingStrip = false;
	} else {
		dismissPrefillNotice();
	}
};

export const usePrefillNotice = (): IgnoredParam[] =>
	usePrefillNoticeStore((state) => state.ignored);

/** Non-React read, matching the convention custom-frames.ts sets. */
export const getPrefillNotice = (): IgnoredParam[] =>
	usePrefillNoticeStore.getState().ignored;
