import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { useEffect, useReducer } from "react";
import { SRGBColorSpace, type Texture, TextureLoader } from "three";

/**
 * Loads a texture from a URL without depending on Suspense. A handful of real
 * printings list a collector id whose art never made it to content.fabrary.net,
 * and a 404 there throws from inside three.js's own `<img>` onerror handler,
 * which fires outside React's render call stack and so can never be caught by a
 * React error boundary. drei's Suspense-based `useTexture` hits exactly this:
 * the throw bubbles past react-three-fiber's own internal boundary and crashes
 * the whole route, not just the one card. This reports the failure instead, so
 * the caller can fall back for just that one image.
 *
 * Successful loads and failures are both cached by URL, so a card seen twice (the
 * active card, then again as OutgoingCard, or a ledger revisit) never re-requests
 * it. A session can open hundreds of packs though, so the cache is bounded (see
 * trimSafeTextureCache) and failures are forgiven (see clearFailedTextureUrls).
 */

/** Insertion order is recency: resolveCached re-inserts whatever it's asked for,
 * so the first entries are the ones used longest ago. */
const textureCache = new Map<string, Texture>();
const failedUrls = new Set<string>();
const inFlight = new Map<string, Promise<void>>();
const loader = new TextureLoader();

/** The single place a texture is loaded, so a preload and a mounted card asking
 * for the same URL share one download and one Texture.
 *
 * sRGB is set here, once, rather than left to whichever material sees the texture
 * first. r3f only sets it when a texture is passed as a built-in material's `map`,
 * and the upload's format depends on it, so a texture that reached the foil shader
 * first was stuck without it for good, and a plain copy of the same card looked
 * washed out, or a foil copy too dark, depending on the order they were seen. */
function ensureLoading(url: string): Promise<void> {
	const pending = inFlight.get(url);
	if (pending) return pending;

	const loading = new Promise<void>((resolve) => {
		loader.load(
			url,
			(texture) => {
				texture.colorSpace = SRGBColorSpace;
				textureCache.set(url, texture);
				resolve();
			},
			undefined,
			() => {
				failedUrls.add(url);
				resolve();
			},
		);
	}).then(() => {
		inFlight.delete(url);
	});
	inFlight.set(url, loading);
	return loading;
}

export type SafeTextureState =
	| { status: "loading" }
	| { status: "loaded"; texture: Texture }
	| { status: "error" };

function resolveCached(url: string): SafeTextureState {
	if (failedUrls.has(url)) return { status: "error" };
	const cached = textureCache.get(url);
	if (!cached) return { status: "loading" };
	textureCache.delete(url);
	textureCache.set(url, cached);
	return { status: "loaded", texture: cached };
}

/** A null `url` means there is nothing to load, and reads the same as a failure,
 * so a caller can use one fallback path for both. */
export function useSafeTexture(url: string | null): SafeTextureState {
	// This reads a cache that changes outside React, so it must run on every
	// render. The compiler would otherwise memoise resolveCached(url) on `url`
	// alone and a card would never see its art arrive.
	"use no memo";

	// A render counter, not the state itself. The state IS the cache, read fresh
	// below on every render for whatever url we were actually handed.
	//
	// This used to hold the resolved texture in useState. A useState initializer
	// only runs on mount, so when the url prop changed (every time the active card
	// advances, and every time the outgoing card takes over the card before it)
	// React returned the PREVIOUS card's texture for that render, and an effect
	// corrected it one render later. That is a guaranteed stale frame on every
	// single advance: for one frame the card on top showed the wrong art, which is
	// the flash of another card that kept surviving fixes aimed at the slide
	// animation. Deriving from the url during render means there is no window in
	// which the two can disagree.
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

/** Fire-and-forget warmup, called by the store when a pack is generated, so most
 * cards' textures are already settled by the time they become active. */
export function preloadSafeTexture(url: string): void {
	if (failedUrls.has(url) || textureCache.has(url)) return;
	void ensureLoading(url);
}

/** Frees the GPU memory and decoded image of all but the `keep` most recently
 * used textures. A card uses roughly 1.5MB of GPU memory and a long session sees
 * thousands of them. The card back is always kept: it's the stand-in for
 * everything else that isn't ready, including after a failure.
 *
 * Disposing a texture that is still on screen only costs a re-upload, and a
 * mounted useSafeTexture reloads anything evicted from under it. */
export function trimSafeTextureCache(keep: number): void {
	let excess = textureCache.size - keep;
	for (const [url, texture] of textureCache) {
		if (excess <= 0) return;
		if (url === CARD_BACK_URL) continue;
		texture.dispose();
		textureCache.delete(url);
		excess--;
	}
}

/** Forgets every failure, so art that only failed because of a brief network
 * problem gets another try instead of staying broken until a reload. Called per
 * pack, so a genuinely missing image costs at most one extra request each time. */
export function clearFailedTextureUrls(): void {
	failedUrls.clear();
}
