import { useEffect, useState } from "react";
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
	const [state, setState] = useState<SafeTextureState>(() =>
		resolveCached(url),
	);

	useEffect(() => {
		const cached = resolveCached(url);
		setState(cached);
		if (cached.status !== "loading") return;

		let cancelled = false;
		loader.load(
			url,
			(texture) => {
				if (cancelled) return;
				textureCache.set(url, texture);
				setState({ status: "loaded", texture });
			},
			undefined,
			() => {
				if (cancelled) return;
				failedUrls.add(url);
				setState({ status: "error" });
			},
		);
		return () => {
			cancelled = true;
		};
	}, [url]);

	return state;
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
