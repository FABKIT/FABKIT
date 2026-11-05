import { SWIPE_THRESHOLD_PX } from "@fabkit/apps/pack-opener/config/scene";
import { stepSetCode } from "@fabkit/apps/pack-opener/lib/set-index";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { getSetIndex } from "@fabkit/shared/data/fab-printings";
import {
	type TouchEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

/** A set change waiting on LeavePackDialog, and the pack it would discard. */
interface LeaveRequest {
	setCode: string;
	pack: DrawnCard[];
}

/** Arrow keys belong to whatever else is using them: a modified arrow is the
 * browser's (Alt+Left is Back), an open dialog owns the keyboard, and the set
 * dropdown uses them to move between its options. Dialogs are checked globally
 * rather than through the event target because focus can sit outside one while
 * it is open, and switching sets behind a dialog is what this exists to stop. */
function arrowKeyBelongsElsewhere(event: KeyboardEvent): boolean {
	if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
		return true;
	}
	if (document.querySelector('[role="dialog"]')) return true;
	return (
		event.target instanceof Element &&
		event.target.closest('[role="listbox"]') !== null
	);
}

/** Every way of moving between sets (arrows, dropdown, swipe, arrow keys) and
 * the gate they all pass through. A pack still being torn open or revealed is
 * never silently discarded: the change pauses on LeavePackDialog first, and
 * the store's selectSet(), which does the actual discarding, runs only once
 * the player has confirmed.
 *
 * Handlers read live store state via getState() rather than this render's own
 * values, so the keydown listener never needs re-attaching (and never goes
 * stale) as the selection or phase changes. */
export function useSetNavigation(hasSets: boolean) {
	const selectSet = usePackOpenerStore((state) => state.selectSet);
	const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
	const touchStartX = useRef<number | null>(null);

	// The request only stands while the pack it would discard is still in
	// flight. The final card hands over to the summary on a timer, which can
	// fire behind the open dialog, and by then its warning that the pack "will
	// not count" is no longer true: the pack is finished and already counted.
	const leaveDialogOpen = usePackOpenerStore(
		(state) =>
			leaveRequest !== null &&
			state.pack === leaveRequest.pack &&
			(state.phase === "tearing" || state.phase === "revealing"),
	);

	const requestSetChange = useCallback(
		(code: string): void => {
			const state = usePackOpenerStore.getState();
			if (code === state.selectedSet) return;
			if (
				state.pack !== null &&
				(state.phase === "tearing" || state.phase === "revealing")
			) {
				setLeaveRequest({ setCode: code, pack: state.pack });
				return;
			}
			selectSet(code);
		},
		[selectSet],
	);

	const step = useCallback(
		(offset: number): void => {
			const sets = getSetIndex();
			if (sets.length === 0) return;
			const { selectedSet } = usePackOpenerStore.getState();
			requestSetChange(stepSetCode(sets, selectedSet, offset));
		},
		[requestSetChange],
	);

	// Left/right arrow keys step through sets whenever the carousel is on
	// screen. There's no text input on this page to conflict with.
	useEffect(() => {
		if (!hasSets) return;
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			if (arrowKeyBelongsElsewhere(event)) return;
			step(event.key === "ArrowLeft" ? -1 : 1);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [hasSets, step]);

	function handleTouchStart(event: TouchEvent): void {
		// Scrolling the set dropdown drifts sideways often enough that it
		// would otherwise switch sets under the player's finger.
		const insideListbox =
			event.target instanceof Element &&
			event.target.closest('[role="listbox"]') !== null;
		touchStartX.current = insideListbox ? null : event.touches[0].clientX;
	}

	function handleTouchEnd(event: TouchEvent): void {
		if (touchStartX.current === null) return;
		const delta = event.changedTouches[0].clientX - touchStartX.current;
		touchStartX.current = null;
		if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
		step(delta > 0 ? -1 : 1);
	}

	return {
		step,
		requestSetChange,
		swipeHandlers: {
			onTouchStart: handleTouchStart,
			onTouchEnd: handleTouchEnd,
		},
		leaveDialogOpen,
		confirmLeave() {
			if (leaveRequest) selectSet(leaveRequest.setCode);
			setLeaveRequest(null);
		},
		cancelLeave() {
			setLeaveRequest(null);
		},
	};
}
