/**
 * Toggle Pill Shell
 *
 * Shared outer shell for the small white pill-shaped toggles used above the
 * card back preview (style switch, hybrid switch). Extracted so both controls
 * are guaranteed to share the same height, rounding and shadow instead of
 * duplicating those values in two files where they could drift apart.
 *
 * This is a presentational shell only — each toggle keeps its own internal
 * markup (sliding knob vs. filled/outlined button).
 */

import type { ReactNode } from "react";

interface TogglePillProps {
	children: ReactNode;
}

export function TogglePill({ children }: TogglePillProps) {
	return (
		<div className="h-9 m-2.5 shadow-2xl rounded-full bg-white">{children}</div>
	);
}
