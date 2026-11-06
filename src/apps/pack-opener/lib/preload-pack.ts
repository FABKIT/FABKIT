import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { preloadSafeTexture } from "@fabkit/apps/pack-opener/lib/texture-cache";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";

/** How many cards ahead of the active one to keep preloaded: the whole pack, on
 * any connection that hasn't told us to go easy. A player can advance every
 * ADVANCE_DEBOUNCE_MS, so a short lookahead shows the card back to anyone
 * tapping quickly, and preloading doesn't add to what a finished pack downloads,
 * it only moves when. */
const DEFAULT_PRELOAD_LOOKAHEAD = Number.MAX_SAFE_INTEGER;
/** For 3g, where sixteen parallel requests would get in each other's way. Six
 * cards stays ahead of a player tapping at full speed without saturating the
 * link. */
const MODERATE_PRELOAD_LOOKAHEAD = 6;
/** For Data Saver and 2G-class connections. navigator.connection doesn't exist
 * in Safari, so every visitor there gets the default rather than a guess. */
const REDUCED_PRELOAD_LOOKAHEAD = 1;

interface NetworkInformationLike {
	saveData?: boolean;
	effectiveType?: string;
}

export function preloadLookaheadCount(): number {
	const connection = (
		navigator as Navigator & { connection?: NetworkInformationLike }
	).connection;
	if (!connection) return DEFAULT_PRELOAD_LOOKAHEAD;
	if (connection.saveData) return REDUCED_PRELOAD_LOOKAHEAD;
	if (
		connection.effectiveType === "2g" ||
		connection.effectiveType === "slow-2g"
	) {
		return REDUCED_PRELOAD_LOOKAHEAD;
	}
	if (connection.effectiveType === "3g") return MODERATE_PRELOAD_LOOKAHEAD;
	return DEFAULT_PRELOAD_LOOKAHEAD;
}

/** Kicks off loading the real images for `count` cards starting at
 * `fromIndex`, clamped to the end of the pack. Called once when a pack is
 * dealt, which on a normal connection covers the whole pack, and again with
 * count 1 on each advance, which only does anything when a reduced lookahead
 * is in force. Uses preloadSafeTexture, not drei's useTexture.preload — see
 * lib/texture-cache.ts for why a real printing's image can 404 and why
 * that can't be handled with drei's Suspense-based loader. */
export function preloadPackTextures(
	pack: DrawnCard[],
	setCode: string,
	fromIndex: number,
	count: number,
): void {
	const end = Math.min(fromIndex + count, pack.length);
	for (let i = fromIndex; i < end; i++) {
		const resolved = resolveCard(pack[i], setCode);
		if (resolved.imageUrl) preloadSafeTexture(resolved.imageUrl);
		// The other face of a double-faced card, warmed with the front.
		// Only a handful of cards in a handful of sets have one, so this
		// costs almost nothing, and without it turning a card over is
		// always a cold fetch: the player waits, watching the card-back
		// stand-in, for art the pack could have fetched while they were
		// still clicking through commons.
		if (resolved.backImageUrl) preloadSafeTexture(resolved.backImageUrl);
	}
}
