import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});
	return () => observer.disconnect();
}

function isDark(): boolean {
	return document.documentElement.getAttribute("data-theme") === "dark";
}

/** True while the site is showing its dark theme. Reads the attribute the theme
 * provider sets on the page rather than its React context, because context does
 * not reach inside the 3D canvas. */
export function useIsDarkTheme(): boolean {
	return useSyncExternalStore(subscribe, isDark);
}
