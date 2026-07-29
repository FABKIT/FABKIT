import type { ReactNode } from "react";
import { useId, useState } from "react";

interface TooltipProps {
	/** Text shown in the bubble. Must already be translated. */
	label: string;
	children: ReactNode;
}

/**
 * Small hover/focus tooltip styled with the site's own tokens, so it reads as part of FABKIT
 * rather than as the browser's native `title` bubble.
 *
 * Pointer-and-keyboard only by design: there are no touch handlers, and `pointer-coarse:hidden`
 * suppresses the bubble on touch devices, where browsers synthesise a hover on tap and would
 * otherwise fire it on every press. Anything a touch user needs must stay reachable without
 * this component.
 */
export function Tooltip({ label, children }: TooltipProps) {
	const [open, setOpen] = useState(false);
	const id = useId();

	return (
		<span className="relative inline-flex">
			{/* A real button rather than a span with tabIndex: natively focusable, and it
			    keeps the trigger in the keyboard flow without fighting a11y lint rules. */}
			<button
				type="button"
				aria-describedby={open ? id : undefined}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
				className="inline-flex min-w-0 cursor-help rounded-xs text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
			>
				{children}
			</button>
			{open && (
				<span
					id={id}
					role="tooltip"
					className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 max-w-48 -translate-x-1/2 rounded-md border border-border-primary bg-surface px-2 py-1 text-xs leading-snug font-medium text-body normal-case shadow-lg pointer-coarse:hidden"
				>
					{label}
				</span>
			)}
		</span>
	);
}
