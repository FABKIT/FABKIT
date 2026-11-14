import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { SRGBColorSpace, type Texture, TextureLoader } from "three";

/**
 * Loads textures from URLs without Suspense, reporting failure instead of
 * throwing (a 404 in drei's useTexture throws outside React and crashes the
 * route). Loads and failures are cached by URL; the cache is bounded (see
 * trimSafeTextureCache) and failures are forgiven (see clearFailedTextureUrls).
 */

/** Insertion order is recency: resolveCached re-inserts whatever it's asked for,
 * so the first entries are the ones used longest ago. */
const textureCache = new Map<string, Texture>();
const failedUrls = new Set<string>();
const inFlight = new Map<string, Promise<void>>();
const loader = new TextureLoader();

/** The single place a texture is loaded (shared by preloads and mounted
 * cards). sRGB is set here because the upload format depends on it. */
export function ensureLoading(url: string): Promise<void> {
	const pending = inFlight.get(url);
	if (pending) return pending;

	const loading = (async () => {
		try {
			await new Promise<void>((resolve) => {
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
			});
		} finally {
			inFlight.delete(url);
		}
	})();
	inFlight.set(url, loading);
	return loading;
}

export type SafeTextureState =
	| { status: "loading" }
	| { status: "loaded"; texture: Texture }
	| { status: "error" };

export function resolveCached(url: string): SafeTextureState {
	if (failedUrls.has(url)) return { status: "error" };
	const cached = textureCache.get(url);
	if (!cached) return { status: "loading" };
	textureCache.delete(url);
	textureCache.set(url, cached);
	return { status: "loaded", texture: cached };
}

/** Fire-and-forget warmup, called by the store when a pack is generated, so most
 * cards' textures are already settled by the time they become active. */
export function preloadSafeTexture(url: string): void {
	if (failedUrls.has(url) || textureCache.has(url)) return;
	void ensureLoading(url);
}

/** Frees the GPU memory and decoded image of all but the `keep` most recently
 * used textures. The card back is always kept: it's the stand-in for anything
 * not ready, including after a failure.
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
