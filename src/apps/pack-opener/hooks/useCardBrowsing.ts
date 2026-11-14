import {
	SWIPE_THRESHOLD_PX,
	WHEEL_STEP_COOLDOWN_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { arrowKeyBelongsElsewhere } from "@fabkit/apps/pack-opener/lib/arrow-keys";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { type TouchEvent, useEffect, useRef } from "react";

/** Steps through a finished pack's cards, and does nothing in any other phase. */
function stepCard(offset: number): void {
	const { phase, stepCard: step } = usePackOpenerStore.getState();
	if (phase === "done") step(offset);
}

/**
 * Every way of browsing a finished pack that isn't a button: the scroll wheel
 * and a sideways swipe over the card (the returned ref and handlers go on the
 * canvas's wrapper), and the left and right arrow keys. While a finished pack is
 * up the arrow keys are this hook's; in every other phase they are the set
 * carousel's (see useSetNavigation.ts).
 */
export function useCardBrowsing() {
	const wheelArea = useRef<HTMLDivElement>(null);
	const lastWheelStepAt = useRef(0);
	const touchStart = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			if (arrowKeyBelongsElsewhere(event)) return;
			stepCard(event.key === "ArrowLeft" ? -1 : 1);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Attached by hand: React's own wheel listener is passive, and this one has
	// to stop the wheel from also scrolling the page down to the footer.
	useEffect(() => {
		const area = wheelArea.current;
		if (!area) return;
		function handleWheel(event: WheelEvent): void {
			if (usePackOpenerStore.getState().phase !== "done") return;
			event.preventDefault();
			// A trackpad reports sideways scrolling on the other axis.
			const delta =
				Math.abs(event.deltaY) >= Math.abs(event.deltaX)
					? event.deltaY
					: event.deltaX;
			if (delta === 0) return;
			// One card per notch. A trackpad sends a stream of events for one
			// gesture, which would otherwise run through the whole pack.
			if (event.timeStamp - lastWheelStepAt.current < WHEEL_STEP_COOLDOWN_MS) {
				return;
			}
			lastWheelStepAt.current = event.timeStamp;
			stepCard(delta > 0 ? 1 : -1);
		}
		area.addEventListener("wheel", handleWheel, { passive: false });
		return () => area.removeEventListener("wheel", handleWheel);
	}, []);

	return {
		ref: wheelArea,
		onTouchStart(event: TouchEvent): void {
			const touch = event.touches[0];
			touchStart.current = { x: touch.clientX, y: touch.clientY };
		},
		onTouchEnd(event: TouchEvent): void {
			if (touchStart.current === null) return;
			const touch = event.changedTouches[0];
			const deltaX = touch.clientX - touchStart.current.x;
			const deltaY = touch.clientY - touchStart.current.y;
			touchStart.current = null;
			if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
			if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
			// Same direction as the set carousel: swiping left brings the next one.
			stepCard(deltaX > 0 ? -1 : 1);
		},
	};
}
