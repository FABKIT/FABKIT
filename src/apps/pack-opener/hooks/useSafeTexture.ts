import {
	ensureLoading,
	resolveCached,
	type SafeTextureState,
} from "@fabkit/apps/pack-opener/lib/texture-cache";
import { useEffect, useReducer } from "react";

/** A texture from lib/texture-cache.ts, for whichever URL this render was handed.
 * A null `url` means there is nothing to load, and reads the same as a failure,
 * so a caller can use one fallback path for both. */
export function useSafeTexture(url: string | null): SafeTextureState {
	// This reads a cache that changes outside React, so it must run on every
	// render. The compiler would otherwise memoise resolveCached(url) on `url`
	// alone and a card would never see its art arrive.
	"use no memo";

	// A render counter, not the state itself. The state IS the cache, derived
	// during render so the url and the texture can never disagree.
	const [, onSettled] = useReducer((tick: number) => tick + 1, 0);
	const state: SafeTextureState =
		url === null ? { status: "error" } : resolveCached(url);
	const { status } = state;

	// `status` is a dependency so a texture evicted, or a failure forgiven, while
	// this is still mounted gets loaded again rather than reading as loading for
	// good. `cancelled` only suppresses the re-render, which would be on an
	// unmounted component: the result is cached regardless.
	useEffect(() => {
		if (url === null || status !== "loading") return;
		let cancelled = false;
		ensureLoading(url).then(() => {
			if (!cancelled) onSettled();
		});
		return () => {
			cancelled = true;
		};
	}, [url, status]);

	return state;
}
