import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { preloadSafeTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";

/** How many cards ahead of the active one to keep preloaded.
 *
 * The whole pack, on any connection that hasn't told us to go easy. This
 * used to be 3, staggered so only a handful of ~200KB images were ever in
 * flight. That protected slow connections at everyone else's expense, and
 * the arithmetic is the giveaway: a player can advance every
 * ADVANCE_DEBOUNCE_MS, so with a lookahead of 3 each card had barely 240ms
 * of head start on the tap that revealed it. Any image slower than that
 * showed the card back instead, which is exactly what was happening on a
 * fast machine on fibre.
 *
 * A whole pack is roughly 3-4MB and the tear animation gives it about 1.9
 * seconds of cover before the first card is even asked for, so there is no
 * reason to ration it. Slow and metered connections still get the tight
 * lookahead below, which is who the staggering was always for. */
const DEFAULT_PRELOAD_LOOKAHEAD = Number.MAX_SAFE_INTEGER;
/** A middle rung for 3g. Measured, a card image averages 197KB, so a full
 * pack is a little over 3MB. Worth knowing before worrying about that
 * number: preloading does NOT increase what a player downloads. The same
 * sixteen images are fetched either way, and only their timing changes, so
 * the whole-pack preload above costs extra bytes only for someone who
 * abandons a pack part-way through. What it protects against is a
 * connection slow enough that sixteen parallel requests get in each other's
 * way, which is a real risk on 3g and not on fibre. Six cards is roughly
 * 720ms of head start at full tapping speed, comfortably ahead of a player
 * without saturating the link. */
const MODERATE_PRELOAD_LOOKAHEAD = 6;
/** A visitor who has said they want less data (Data Saver, or a 2G-class
 * connection) gets a tighter lookahead instead. navigator.connection
 * doesn't exist in Safari — that's a normal, expected case here, not a
 * failure, and just means every visitor there gets the default lookahead
 * rather than this app guessing at their connection quality. */
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
 * textures/useSafeTexture.ts for why a real printing's image can 404 and why
 * that can't be handled with drei's Suspense-based loader. */
export function preloadPackTextures(
	pack: DrawnCard[],
	setCode: string,
	fromIndex: number,
	count: number,
): void {
	const end = Math.min(fromIndex + count, pack.length);
	for (let i = fromIndex; i < end; i++) {
		const resolved = activeCardResolver.resolve(pack[i], setCode);
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
