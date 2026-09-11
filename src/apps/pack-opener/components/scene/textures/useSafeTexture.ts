import { useEffect, useReducer } from "react";
import { type Texture, TextureLoader } from "three";

/**
 * Loads a texture from a URL without depending on Suspense. A handful of
 * real printings (see card-resolver.ts's fabPrintingsCardResolver, sourced
 * from the-fab-cube's dataset) list a collector id whose art never made it
 * to content.fabrary.net — a 404 there throws from inside three.js's own
 * `<img>` onerror handler, which fires outside React's render call stack
 * and so can never be caught by a React error boundary. drei's `useTexture`
 * (Suspense-based) hits exactly this: the throw bubbles past
 * react-three-fiber's own internal boundary and crashes the whole route,
 * not just the one card. This hook catches the failure itself instead, so
 * Card3D can fall back to placeholder art for just that one card — see
 * "Card data" in src/apps/pack-opener/CLAUDE.md.
 *
 * Successful loads and outright failures are both cached by URL so a card
 * seen twice in a session (the active card, then again as OutgoingCard, or
 * a summary-ledger revisit) never re-requests it.
 */
const textureCache = new Map<string, Texture>();
const failedUrls = new Set<string>();
const loader = new TextureLoader();

export type SafeTextureState =
	| { status: "loading" }
	| { status: "loaded"; texture: Texture }
	| { status: "error" };

export function useSafeTexture(url: string): SafeTextureState {
	// A render counter, not the state itself. The state IS the cache, read
	// fresh below on every render for whatever url we were actually handed.
	//
	// This used to hold the resolved texture in useState. A useState
	// initializer only runs on mount, so when the url prop changed (every
	// time the active card advances, and every time the outgoing card takes
	// over the card before it) React returned the PREVIOUS card's texture
	// for that render, and an effect corrected it one render later. That is
	// a guaranteed stale frame on every single advance: for one frame the
	// card on top showed the wrong art, which is the flash of another card
	// that kept surviving fixes aimed at the slide animation. Deriving from
	// the url during render means there is no window in which the two can
	// disagree.
	const [, onLoaded] = useReducer((tick: number) => tick + 1, 0);

	useEffect(() => {
		if (resolveCached(url).status !== "loading") return;

		let cancelled = false;
		// The result is cached even when this effect has been cleaned up.
		// `cancelled` only suppresses the re-render, which would be on an
		// unmounted component; throwing away a download that already
		// finished just means the next card to ask for it pays for it
		// again. React's StrictMode makes that the common case in
		// development, since it runs every effect twice.
		loader.load(
			url,
			(texture) => {
				textureCache.set(url, texture);
				if (cancelled) return;
				onLoaded();
			},
			undefined,
			() => {
				failedUrls.add(url);
				if (cancelled) return;
				onLoaded();
			},
		);
		return () => {
			cancelled = true;
		};
	}, [url]);

	return resolveCached(url);
}

function resolveCached(url: string): SafeTextureState {
	if (failedUrls.has(url)) return { status: "error" };
	const cached = textureCache.get(url);
	return cached ? { status: "loaded", texture: cached } : { status: "loading" };
}

/** Fire-and-forget warmup, mirroring drei's `useTexture.preload()` — called
 * by stores/pack-opener.ts right when a pack is generated, so most cards'
 * textures are already cached (loaded or known-failed) by the time they
 * become active during the reveal. */
export function preloadSafeTexture(url: string): void {
	if (failedUrls.has(url) || textureCache.has(url)) return;
	loader.load(
		url,
		(texture) => {
			textureCache.set(url, texture);
		},
		undefined,
		() => {
			failedUrls.add(url);
		},
	);
}
