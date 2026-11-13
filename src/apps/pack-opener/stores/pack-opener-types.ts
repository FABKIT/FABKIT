import type { Currency } from "@fabkit/apps/pack-opener/lib/currency";
import type {
	DrawnCard,
	PackConfig,
} from "@fabkit/apps/pack-opener/pack/types";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";

export type PackOpenerPhase = "idle" | "tearing" | "revealing" | "done";

/** The card the scene and caption are showing: the one chosen from the ledger
 * while revisiting a finished pack, otherwise the one reached in the reveal. */
export function selectActiveCard(
	state: Pick<
		PackOpenerState,
		"phase" | "pack" | "revealIndex" | "revisitIndex"
	>,
): DrawnCard | undefined {
	const index =
		state.phase === "done" && state.revisitIndex !== null
			? state.revisitIndex
			: state.revealIndex;
	return state.pack?.[index];
}

export interface PackOpenerState {
	phase: PackOpenerPhase;
	pack: DrawnCard[] | null;
	/** -1 until the first card starts revealing. */
	revealIndex: number;
	/** Epoch ms the current phase (or current card's slide) began — the sole
	 * source of truth every animation timer reads from. */
	phaseStartedAt: number | null;
	/** Epoch ms the first card of the current pack appeared. Unlike
	 * phaseStartedAt it does not move per card, so the arrival animation plays
	 * once per pack; stored here so a remount resumes it instead of restarting. */
	revealStartedAt: number | null;
	/** True while the player is looking at the other face of a double-faced
	 * card (see cards/card-resolver.ts's backImageUrl). Reset to the front for
	 * each newly revealed or revisited card. */
	showingOtherFace: boolean;
	/** Every pack completed this session, in order; the raw material for the
	 * stats dialog. A flat list, not pre-aggregated. In-memory only. */
	openedPacksThisSession: OpenedPackRecord[];
	/** Set code driving getPackConfig() for the next openPack() call, and
	 * shown by SetCarousel — null until the carousel picks a default (the
	 * set index hasn't loaded yet, or nothing was ever stored). Persisted by
	 * the store. */
	selectedSet: string | null;
	/** The one artwork PackMesh.tsx renders for selectedSet. Rolled afresh
	 * (see lib/pack-art.ts) on arriving at the page, selecting a set, readying
	 * the next pack and resetting the session, and never by a render. Null
	 * falls back to the mock pack; see PackMesh.tsx. */
	packArtUrl: string | null;
	/** Set while phase is "done" and the player has tapped a row in the
	 * summary ledger to look at that card again — read-only, doesn't touch
	 * `revealIndex` or re-roll anything. Null means "not revisiting". */
	revisitIndex: number | null;
	/** Which marketplace's prices every price surface shows (TCGplayer dollars
	 * or Cardmarket euros). Persisted by the store. */
	currency: Currency;
	/** Bumped each time a set's price snapshots finish loading, so
	 * hooks/usePrices.ts re-reads the module caches React cannot see change. */
	pricesVersion: number;
	/** The set `pack` was dealt for; stays correct after selectedSet moves on.
	 * Null before the first pack of the session. */
	packSetCode: string | null;
}

export interface PackOpenerActions {
	/** Deals and tears open a pack, from a closed pack only. Waits for the
	 * set's printings if not cached; a failed load still deals. */
	openPack(config?: PackConfig): void;
	advanceReveal(): void;
	/** Switches the active set — persists the choice, re-rolls its pack
	 * art, and resets to idle so a stale pack/summary from the previous
	 * set never lingers on screen. */
	selectSet(setCode: string): void;
	/** Called once the set index has loaded: picks a default set on a first
	 * visit or when the stored set is gone, warms it, and re-rolls the artwork
	 * outside a pack in flight. */
	initializeSetArt(): void;
	/** Shows a specific card from the just-finished pack (phase "done" only).
	 * Read-only and sticky: opening a new pack or switching sets resets it. */
	revisitCard(index: number): void;
	/** Turns the active card over; the UI only offers it for two-sided cards. */
	flipCard(): void;
	/** Switches which marketplace's prices are shown, and remembers it. */
	setCurrency(currency: Currency): void;
	/** Throws away everything opened so far and restarts the count, keeping the
	 * chosen set. Destructive: the UI confirms first. */
	resetSession(): void;
	/** Clears a finished pack and brings out the next one closed, in a fresh
	 * one of the set's pack fronts, without opening it. */
	readyAnotherPack(): void;
}
