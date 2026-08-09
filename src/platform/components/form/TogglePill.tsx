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
	/**
	 * When true, the shell has no background or shadow of its own — just the
	 * sizing and spacing, so it lines up with a filled sibling pill. Used for
	 * toggles that should blend into the page while inactive (e.g. hybrid
	 * off) rather than always showing a white pill behind them.
	 */
	transparent?: boolean;
}

export function TogglePill({ children, transparent = false }: TogglePillProps) {
	// No margin of its own — spacing is the parent row's job. The pill used to
	// carry m-2.5, which cost 20px of vertical space in a column where the card
	// preview needs every pixel to stay above the fold.
	return (
		<div
			className={`h-9 rounded-full ${transparent ? "" : "shadow-2xl bg-white"}`}
		>
			{children}
		</div>
	);
}
