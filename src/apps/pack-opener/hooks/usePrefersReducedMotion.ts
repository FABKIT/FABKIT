import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the OS/browser has "reduce motion" on. Used by Card3D to skip
 * the pointer-driven tilt entirely (see the execution plan, section 3.4)
 * — pack-opener-local since it's the first consumer; nothing elsewhere in
 * the codebase currently checks this preference. */
export function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(
		() => window.matchMedia(QUERY).matches,
	);

	useEffect(() => {
		const mediaQuery = window.matchMedia(QUERY);
		const handleChange = () => setReduced(mediaQuery.matches);
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return reduced;
}
