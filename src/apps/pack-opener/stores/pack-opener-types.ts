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
	/** Epoch ms the FIRST card of the current pack appeared, i.e. the moment
	 * the tear handed over to the reveal. Unlike phaseStartedAt this does
	 * not move on each advanceReveal(), which is exactly what the card's
	 * arrival animation needs: it plays once per pack, not once per card.
	 * It lives here, rather than as a mount timestamp inside the scene,
	 * because a component that times itself from its own mount restarts
	 * that animation whenever React remounts it (StrictMode's double mount,
	 * a Suspense boundary re-suspending) — which read on screen as the card
	 * appearing, vanishing and appearing again. Same reason the tear reads
	 * off phaseStartedAt: a remount mid-animation has to pick the animation
	 * up where it is, never restart it. */
	revealStartedAt: number | null;
	/** True while the player is looking at the OTHER face of a double-faced
	 * card (see cards/card-resolver.ts's backImageUrl). Lives here rather
	 * than in the scene because the control that toggles it is 2D chrome
	 * (RevealCaption.tsx) while the thing it changes is the 3D card. Always
	 * back to the front for a newly revealed or revisited card: a player
	 * who flipped one card has not asked to see every later one reversed. */
	showingOtherFace: boolean;
	/** Every pack completed this session, in order — the raw material for
	 * the session stats dialog (see stats/session-stats.ts's
	 * computeSessionStats, and SessionStatsDialog.tsx) and, by its length,
	 * the session's pack count. Deliberately just a flat list of
	 * {setCode, cards}, not pre-aggregated, so promoting this to persistent
	 * per-device history later is "persist this array", not a redesign.
	 * In-memory only: resets on reload. */
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
	/** Which marketplace's prices every price surface shows — TCGplayer
	 * dollars or Cardmarket euros. Lives in the store rather than in the
	 * summary component because three separate surfaces read it (the pack
	 * ledger, the session stats dialog, the set info dialog) and they must
	 * never disagree about which currency is on screen. Persisted by the
	 * store. */
	currency: Currency;
	/** Goes up each time a set's price snapshots finish loading. Prices are
	 * read synchronously out of module caches, which React cannot see change,
	 * so hooks/usePrices.ts subscribes to this to re-read them. Without it a
	 * price that arrived after its row rendered stayed "Not priced yet" until
	 * the currency was toggled. */
	pricesVersion: number;
	/** The set `pack` was actually generated for (packConfig.id at the time
	 * the pack was dealt) — recorded separately from `selectedSet` so card
	 * resolution stays correct even after selectedSet moves on, and so
	 * every resolve() call site doesn't have to reach for two pieces of
	 * state. Null before the first pack of the session is opened. */
	packSetCode: string | null;
}

export interface PackOpenerActions {
	/** Deals and tears open a pack, from a closed pack only. Waits for the
	 * set's printings first when they haven't arrived yet, so every surface
	 * resolves the pack from the same real data. That wait is skipped
	 * entirely once they are cached, and a failed load still deals, leaving
	 * the resolver to fall back per card. */
	openPack(config?: PackConfig): void;
	advanceReveal(): void;
	/** Switches the active set — persists the choice, re-rolls its pack
	 * art, and resets to idle so a stale pack/summary from the previous
	 * set never lingers on screen. */
	selectSet(setCode: string): void;
	/** Called once the set index has finished loading (see SetCarousel's
	 * mount effect) — picks a default set on a first-ever visit, or when the
	 * stored set is no longer in the index, and warms whichever set that
	 * leaves selected. Re-rolls the artwork on every call outside a pack in
	 * flight, which is what makes arriving at the page show a fresh pack
	 * front. */
	initializeSetArt(): void;
	/** Shows a specific card from the just-finished pack — only valid once
	 * phase is "done". Read-only: it doesn't touch `revealIndex` or re-roll
	 * anything. Deliberately sticky, with no matching "clear" action: which
	 * card is on screen and whether the summary ledger is open are
	 * independent of each other (see PackLedger.tsx), so reopening the
	 * ledger must not silently swap the card back. Opening a new pack or
	 * switching sets is what resets it. */
	revisitCard(index: number): void;
	/** Turns the active card over. Only offered for cards that have another
	 * side: RevealCaption.tsx hides the control for everything else, and this
	 * action itself toggles unconditionally. */
	flipCard(): void;
	/** Switches which marketplace's prices are shown, and remembers it. */
	setCurrency(currency: Currency): void;
	/** Throws away everything opened so far and starts counting from pack
	 * one again, without touching the chosen set or reloading the page.
	 * Destructive on purpose (the session ledger is the only record of a
	 * run), so the UI confirms first — see SessionControls.tsx. */
	resetSession(): void;
	/** Clears a finished pack and brings out the next one closed, in a fresh
	 * one of the set's pack fronts, without opening it. */
	readyAnotherPack(): void;
}
