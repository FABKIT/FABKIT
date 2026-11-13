import { type RefObject, useEffect } from "react";

/** Collapses a panel when the player presses anywhere outside it — but not on
 * a dialog open on top of it (the pull-rates dialog, the session-stats
 * dialog), which portals outside the panel's own DOM subtree and would
 * otherwise register as "outside". Every Headless UI Dialog carries
 * role="dialog" on its root, so this check covers all of them generically
 * rather than tracking each one's own open state here. */
export function useCollapseOnOutsidePointer(
	panelRef: RefObject<HTMLElement | null>,
	active: boolean,
	onCollapse: () => void,
): void {
	useEffect(() => {
		if (!active) return;
		function handlePointerDown(event: PointerEvent): void {
			if (!panelRef.current) return;
			const target = event.target as Node;
			if (panelRef.current.contains(target)) return;
			if (target instanceof Element && target.closest('[role="dialog"]')) {
				return;
			}
			onCollapse();
		}
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [panelRef, active, onCollapse]);
}
