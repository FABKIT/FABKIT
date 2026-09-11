import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { clearCardTextureCache } from "@fabkit/apps/pack-opener/components/scene/textures/useCardTexture";
import { preloadSafeTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture";
import {
	ADVANCE_DEBOUNCE_MS,
	LAST_CARD_AUTO_SUMMARY_MS,
	TEAR_DURATION_MS,
	TEAR_START_DELAY_MS,
	TEAR_TAIL_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import type { Currency } from "@fabkit/apps/pack-opener/lib/currency";
import { warmPrices } from "@fabkit/apps/pack-opener/lib/pricing";
import { generatePack } from "@fabkit/apps/pack-opener/pack/generate-pack";
import {
	DEFAULT_PACK_CONFIG,
	getPackConfig,
} from "@fabkit/apps/pack-opener/pack/odds";
import { orderForReveal } from "@fabkit/apps/pack-opener/pack/reveal-order";
import type {
	DrawnCard,
	PackConfig,
} from "@fabkit/apps/pack-opener/pack/types";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";
import { trackEvent } from "@fabkit/platform/analytics";
import {
	getSetIndex,
	loadSetPrintings,
	type SetIndexEntry,
} from "@fabkit/shared/data/fab-printings";
import { useTexture } from "@react-three/drei";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** How many cards ahead of the active one to keep preloaded.
 *
 * The whole pack, on any connection that hasn't told us to go easy. This
 * used to be 3, staggered so only a handful of ~200KB images were ever in
 * flight (see the execution plan, section 5, fix 2). That protected slow
 * connections at everyone else's expense, and the arithmetic is the giveaway:
 * a player can advance every ADVANCE_DEBOUNCE_MS, so with a lookahead of 3
 * each card had barely 240ms of head start on the tap that revealed it. Any
 * image slower than that showed the card back instead, which is exactly what
 * was happening on a fast machine on fibre.
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
/** Fix 4: a visitor who has said they want less data (Data Saver, or a
 * 2G-class connection) gets a tighter lookahead instead. navigator.connection
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
 * generated (see openPack below), which on a normal connection covers the
 * whole pack, and again with count 1 on each advance, which only does
 * anything when a reduced lookahead is in force. Uses preloadSafeTexture,
 * not drei's useTexture.preload — see textures/useSafeTexture.ts for why a
 * real printing's image can 404 and why that can't be handled with drei's
 * Suspense-based loader. */
function preloadPackTextures(
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

/** One of a set's uploaded pack-front artworks, chosen at random. Null when
 * nothing has been uploaded for this set yet, in which case PackMesh.tsx
 * falls back to the mock canvas-drawn pack.
 *
 * Re-rolled every time the pack opener mounts and every time a set is
 * selected, rather than once and then kept for the session. A set can have
 * several pack fronts (Welcome to Rathe has four, one per hero) and seeing
 * the same one every visit made a set with four artworks look like a set
 * with one. */
/** Picks a fresh artwork for a set code and starts loading it, or null if
 * the set has none uploaded (or is not in the index yet). The single place
 * that turns "which set" into "which pack front", shared by openPack,
 * selectSet and initializeSetArt so the three cannot drift apart. */
function rollPackArt(setCode: string | null): string | null {
	if (!setCode) return null;
	const entry = getSetIndex().find((set) => set.code === setCode);
	if (!entry) return null;
	// Every artwork this set has, not just the one being used now.
	//
	// PackMesh reads its texture through drei's useTexture, which is
	// Suspense-based: an artwork that is not already cached suspends the
	// whole canvas and the player sees nothing at all until it arrives.
	// Since a fresh artwork is rolled on every "Open Another Pack", a set
	// with four pack fronts was a cold fetch three times out of four, no
	// matter how many packs had been opened. Warming the set's whole
	// (small, local, 1 to 4 file) collection on selection means the roll
	// is always a cache hit by the time anyone opens anything.
	for (const artUrl of entry.packArt) useTexture.preload(artUrl);
	return pickPackArt(entry);
}

function pickPackArt(entry: SetIndexEntry): string | null {
	if (entry.packArt.length === 0) return null;
	const index = Math.floor(Math.random() * entry.packArt.length);
	return entry.packArt[index];
}

export type PackOpenerPhase = "idle" | "tearing" | "revealing" | "done";

export interface PackOpenerState {
	phase: PackOpenerPhase;
	pack: DrawnCard[] | null;
	/** -1 until the first card starts revealing. */
	revealIndex: number;
	/** Epoch ms the current phase (or current card's flip) began — the sole
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
	packsOpenedThisSession: number;
	/** Every pack completed this session, in order — the raw material for
	 * the session stats dialog (see stats/session-stats.ts's
	 * computeSessionStats, and SessionStatsDialog.tsx). Deliberately just a
	 * flat list of {setCode, cards}, not pre-aggregated, so promoting this
	 * to persistent per-device history later (execution plan, section 9) is
	 * "persist this array", not a redesign. In-memory only — resets on
	 * reload, same as packsOpenedThisSession above. */
	openedPacksThisSession: OpenedPackRecord[];
	/** Set code driving getPackConfig() for the next openPack() call, and
	 * shown by SetCarousel — null until the carousel picks a default (the
	 * set index hasn't loaded yet, or nothing was ever stored). See
	 * SELECTED_SET_STORAGE_KEY below for the persisted value. */
	selectedSet: string | null;
	/** The one artwork PackMesh.tsx renders for selectedSet, picked once
	 * (see pickPackArt) and held stable across every pack opened for that
	 * set — never re-rolled by a render. Null falls back to the mock pack;
	 * see PackMesh.tsx. */
	packArtUrl: string | null;
	/** Set while phase is "done" and the player has tapped a row in the
	 * summary ledger to look at that card again — read-only, doesn't touch
	 * `revealIndex` or re-roll anything. Null means "not revisiting". */
	revisitIndex: number | null;
	/** Which marketplace's prices every price surface shows — TCGplayer
	 * dollars or Cardmarket euros. Lives in the store rather than in the
	 * summary component because three separate surfaces read it (the pack
	 * ledger, the session stats dialog, the set info dialog) and they must
	 * never disagree about which currency is on screen. Persisted, see
	 * CURRENCY_STORAGE_KEY. */
	currency: Currency;
	/** The set `pack` was actually generated for (packConfig.id at the time
	 * openPack() ran) — recorded separately from `selectedSet` so card
	 * resolution stays correct even after selectedSet moves on, and so
	 * every resolve() call site doesn't have to reach for two pieces of
	 * state. Null before the first pack of the session is opened. */
	packSetCode: string | null;
}

export interface PackOpenerActions {
	openPack(config?: PackConfig): void;
	advanceReveal(): void;
	/** Switches the active set — persists the choice, re-rolls its pack
	 * art, and resets to idle so a stale pack/summary from the previous
	 * set never lingers on screen. */
	selectSet(setCode: string): void;
	/** Called once the set index has finished loading (see SetCarousel's
	 * mount effect) — picks a default set on a first-ever visit, or, for a
	 * returning visitor whose selectedSet was already restored from
	 * localStorage before the index existed, resolves that set's pack art
	 * now that it can. A no-op once packArtUrl is already resolved for the
	 * current selection, so it's safe to call on every mount. */
	initializeSetArt(): void;
	/** Shows a specific card from the just-finished pack — only valid once
	 * phase is "done". Read-only: it doesn't touch `revealIndex` or re-roll
	 * anything. Deliberately sticky, with no matching "clear" action: which
	 * card is on screen and whether the summary ledger is open are
	 * independent of each other (see PackSummary.tsx), so reopening the
	 * ledger must not silently swap the card back. Opening a new pack or
	 * switching sets is what resets it. */
	revisitCard(index: number): void;
	/** Turn the active card over, for the double-faced cards that have
	 * another side. No-ops for everything else, so the caller does not have
	 * to check first. */
	flipCard(): void;
	/** Switches which marketplace's prices are shown, and remembers it. */
	setCurrency(currency: Currency): void;
	/** Throws away everything opened so far and starts counting from pack
	 * one again, without touching the chosen set or reloading the page.
	 * Destructive on purpose (the session ledger is the only record of a
	 * run), so the UI confirms first — see ResetSessionDialog.tsx. */
	resetSession(): void;
	/** Clears a finished pack away and brings out the next closed one, in
	 * a fresh one of the set's pack fronts, WITHOUT opening it.
	 *
	 * This is what "Open Another Pack" does now. It used to call openPack()
	 * directly, which tore the new pack open on its own the moment the
	 * button was pressed. Opening a booster is the thing the player came to
	 * do, and it was happening to them rather than being done by them; it
	 * also meant the new pack's artwork was only ever glimpsed for the
	 * fraction of a second before the tear started. Now the pack is put in
	 * front of them closed and waits to be tapped, exactly as it does on a
	 * first visit. */
	readyAnotherPack(): void;
}

const SELECTED_SET_STORAGE_KEY = "pack-opener:selected-set";
const CURRENCY_STORAGE_KEY = "pack-opener:currency";

/** Deliberately not a shared safeStorage util (see Fabble's
 * src/apps/fabble/game/storage.ts) — apps can't import each other, and
 * this store only ever touches one key, so a tiny inline try/catch is
 * simpler than a new shared module for it. */
function readStoredSelectedSet(): string | null {
	try {
		return localStorage.getItem(SELECTED_SET_STORAGE_KEY);
	} catch {
		return null;
	}
}

function writeStoredSelectedSet(setCode: string): void {
	try {
		localStorage.setItem(SELECTED_SET_STORAGE_KEY, setCode);
	} catch {
		// Private mode / quota exceeded — the selection just won't survive
		// a reload, which is a fine degrade for a preference like this.
	}
}

/** Dollars unless this visitor has said otherwise. Deliberately not guessed
 * from the browser's locale: a euro price here is a Cardmarket price, and
 * a visitor's language says nothing about which marketplace they buy from.
 * They pick once and it sticks. */
function readStoredCurrency(): Currency {
	try {
		return localStorage.getItem(CURRENCY_STORAGE_KEY) === "EUR" ? "EUR" : "USD";
	} catch {
		return "USD";
	}
}

function writeStoredCurrency(currency: Currency): void {
	try {
		localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
	} catch {
		// Same fine degrade as the set selection above.
	}
}

const initialState: PackOpenerState = {
	phase: "idle",
	pack: null,
	revealIndex: -1,
	phaseStartedAt: null,
	revealStartedAt: null,
	showingOtherFace: false,
	packsOpenedThisSession: 0,
	openedPacksThisSession: [],
	selectedSet: readStoredSelectedSet(),
	currency: readStoredCurrency(),
	packArtUrl: null,
	revisitIndex: null,
	packSetCode: null,
};

export const usePackOpenerStore = create<PackOpenerState & PackOpenerActions>()(
	devtools((set, get) => {
		/** Ends the pack and hands over to the summary. Shared by the last
		 * tap and by the automatic hand-over on the final card (see
		 * LAST_CARD_AUTO_SUMMARY_MS), so both paths record the pack into
		 * session stats identically rather than one of them drifting. */
		function completePack(pack: DrawnCard[], setCode: string | null): void {
			set(
				{
					phase: "done",
					packsOpenedThisSession: get().packsOpenedThisSession + 1,
					openedPacksThisSession: [
						...get().openedPacksThisSession,
						{ setCode: setCode ?? DEFAULT_PACK_CONFIG.id, cards: pack },
					],
				},
				undefined,
				"pack-opener/packCompleted",
			);
			trackEvent({ name: "pack_opener_pack_completed" });
		}

		return {
			...initialState,

			openPack(config) {
				const { phase, selectedSet } = get();
				if (phase !== "idle" && phase !== "done") return;

				// "Open Another Pack" should feel like reaching into the box
				// again, so it draws a different one of the set's pack fronts.
				// Only from `done` though: from `idle` the closed pack is
				// already on screen and being looked at, and swapping its
				// artwork at the instant it is tapped would read as a glitch
				// rather than as a new pack.
				const rolledArt =
					phase === "done" ? rollPackArt(selectedSet) : get().packArtUrl;

				const packConfig = config ?? getPackConfig(selectedSet ?? undefined);
				clearCardTextureCache();
				const pack = orderForReveal(generatePack(packConfig));
				preloadPackTextures(pack, packConfig.id, 0, preloadLookaheadCount());
				set(
					{
						phase: "tearing",
						packArtUrl: rolledArt,
						pack,
						revealIndex: -1,
						phaseStartedAt: Date.now(),
						revealStartedAt: null,
						showingOtherFace: false,
						revisitIndex: null,
						packSetCode: packConfig.id,
					},
					undefined,
					"pack-opener/openPack",
				);
				trackEvent({ name: "pack_opener_pack_opened" });

				setTimeout(
					() => {
						if (get().phase !== "tearing" || get().pack !== pack) return;
						set(
							{
								phase: "revealing",
								revealIndex: 0,
								phaseStartedAt: Date.now(),
								revealStartedAt: Date.now(),
							},
							undefined,
							"pack-opener/tearComplete",
						);
						const revealed = pack[0];
						trackEvent({
							name: "pack_opener_card_revealed",
							data: {
								rarity: revealed.rarity,
								treatment: revealed.treatment,
							},
						});
					},
					TEAR_START_DELAY_MS + TEAR_DURATION_MS + TEAR_TAIL_MS,
				);
			},

			advanceReveal() {
				const { phase, pack, revealIndex, phaseStartedAt, packSetCode } = get();
				if (phase !== "revealing" || !pack) return;
				if (
					phaseStartedAt !== null &&
					Date.now() - phaseStartedAt < ADVANCE_DEBOUNCE_MS
				) {
					return;
				}

				const nextIndex = revealIndex + 1;
				if (nextIndex >= pack.length) {
					completePack(pack, packSetCode);
					return;
				}

				set(
					{
						revealIndex: nextIndex,
						phaseStartedAt: Date.now(),
						showingOtherFace: false,
					},
					undefined,
					"pack-opener/advanceReveal",
				);
				// Keeps the lookahead window moving forward one card at a time as
				// the player advances — the cards behind this frontier were
				// already preloaded by openPack's initial batch or an earlier
				// call here, so only the new topmost index needs fetching.
				const frontierIndex = nextIndex + preloadLookaheadCount() - 1;
				preloadPackTextures(
					pack,
					packSetCode ?? DEFAULT_PACK_CONFIG.id,
					frontierIndex,
					1,
				);

				// The last card is already on screen at this point, so requiring
				// one more tap to see the summary asked the player to dismiss the
				// pack's best card to reveal nothing. Hand over on its own after
				// a beat instead. Re-checks everything on fire rather than
				// holding a cancellable handle: a tap that completes the pack
				// early, or switching sets out from under it, both simply make
				// these conditions false.
				if (nextIndex === pack.length - 1) {
					setTimeout(() => {
						const live = get();
						if (
							live.phase !== "revealing" ||
							live.pack !== pack ||
							live.revealIndex !== nextIndex
						) {
							return;
						}
						completePack(pack, live.packSetCode);
					}, LAST_CARD_AUTO_SUMMARY_MS);
				}
				const revealed = pack[nextIndex];
				trackEvent({
					name: "pack_opener_card_revealed",
					data: {
						rarity: revealed.rarity,
						treatment: revealed.treatment,
					},
				});
			},

			selectSet(setCode) {
				const { selectedSet } = get();
				if (setCode === selectedSet) return;
				// The carousel now stays visible during tearing/revealing (see
				// SetCarousel.tsx) so a player can switch sets mid-pack. That is a
				// deliberate, user-facing decision, not something this store should
				// silently allow or silently block: SetCarousel gates the call
				// behind LeavePackDialog, which warns that an in-flight pack is
				// discarded and does not count toward session stats, before ever
				// calling this action. This action itself stays unconditional —
				// it already resets pack/phase/revealIndex cleanly below, which is
				// exactly "discard the pack" — so there is nothing else to guard
				// here once the UI has confirmed the player wants that.
				const packArtUrl = rollPackArt(setCode);
				// Warm the set's own printing pool ahead of the next openPack()
				// call, same spirit as the pack-art preload above — see
				// card-resolver.ts's fabPrintingsCardResolver, which needs this
				// loaded to show the set's own cards rather than falling back
				// cross-set. Errors swallowed like every other loader here; a
				// slow/failed load just means that fallback kicks in instead.
				loadSetPrintings(setCode).catch(() => {});
				// Same for both price snapshots — a set with no price file (or a
				// failed fetch) just shows dashes everywhere a price would go,
				// see PackSummary.tsx and SetInfoDialog.tsx.
				warmPrices(setCode);

				writeStoredSelectedSet(setCode);
				set(
					{
						selectedSet: setCode,
						packArtUrl,
						phase: "idle",
						pack: null,
						revealIndex: -1,
						phaseStartedAt: null,
						revealStartedAt: null,
						showingOtherFace: false,
						revisitIndex: null,
						packSetCode: null,
					},
					undefined,
					"pack-opener/selectSet",
				);
			},

			initializeSetArt() {
				const { selectedSet, phase } = get();
				const sets = getSetIndex();
				if (sets.length === 0) return;
				// Never swap the artwork out from under a pack that is being
				// torn open or revealed. Every other moment is fair game: this
				// runs when the page mounts, so arriving at the pack opener
				// re-rolls which of a set's artworks is on the counter.
				if (phase === "tearing" || phase === "revealing") return;

				if (!selectedSet) {
					const latest = sets[sets.length - 1];
					writeStoredSelectedSet(latest.code);
					const url = rollPackArt(latest.code);
					loadSetPrintings(latest.code).catch(() => {});
					warmPrices(latest.code);
					set(
						{ selectedSet: latest.code, packArtUrl: url },
						undefined,
						"pack-opener/initializeSetArt",
					);
					return;
				}

				// Always warm the returning visitor's already-selected set's
				// printing pool and price snapshots too, even when packArtUrl below
				// short-circuits — this runs once per mount either way (see this
				// action's own doc comment) and every loader is idempotent per
				// set code.
				loadSetPrintings(selectedSet).catch(() => {});
				warmPrices(selectedSet);

				set(
					{ packArtUrl: rollPackArt(selectedSet) },
					undefined,
					"pack-opener/initializeSetArt",
				);
			},

			flipCard() {
				set(
					{ showingOtherFace: !get().showingOtherFace },
					undefined,
					"pack-opener/flipCard",
				);
			},

			setCurrency(currency) {
				if (get().currency === currency) return;
				writeStoredCurrency(currency);
				set({ currency }, undefined, "pack-opener/setCurrency");
				trackEvent({
					name: "pack_opener_currency_changed",
					data: { currency },
				});
			},

			resetSession() {
				// Everything the session ledger is built from goes, and the
				// player is put back in front of a closed pack of the set they
				// were already on — the same place readyAnotherPack leaves
				// them, so a reset feels like starting the visit again rather
				// than landing somewhere new. selectedSet and its artwork are
				// explicitly kept rather than reset to initialState's values,
				// which would drop the pack front back to the mock one and
				// re-read the set from localStorage.
				set(
					{
						phase: "idle",
						pack: null,
						revealIndex: -1,
						phaseStartedAt: Date.now(),
						revealStartedAt: null,
						showingOtherFace: false,
						revisitIndex: null,
						packSetCode: null,
						packsOpenedThisSession: 0,
						openedPacksThisSession: [],
						packArtUrl: rollPackArt(get().selectedSet),
					},
					undefined,
					"pack-opener/resetSession",
				);
				trackEvent({ name: "pack_opener_session_reset" });
			},

			readyAnotherPack() {
				if (get().phase !== "done") return;
				set(
					{
						phase: "idle",
						// Rolled HERE rather than at the tap, so the player sees
						// which pack front they are about to open. openPack()
						// deliberately keeps whatever art is on screen when it
						// starts from idle, so the two do not fight.
						packArtUrl: rollPackArt(get().selectedSet),
						pack: null,
						revealIndex: -1,
						revisitIndex: null,
						showingOtherFace: false,
						phaseStartedAt: Date.now(),
						revealStartedAt: null,
					},
					undefined,
					"pack-opener/readyAnotherPack",
				);
			},

			revisitCard(index) {
				const { phase, pack } = get();
				if (phase !== "done" || !pack) return;
				if (index < 0 || index >= pack.length) return;
				set(
					{ revisitIndex: index, showingOtherFace: false },
					undefined,
					"pack-opener/revisitCard",
				);
			},
		};
	}),
);
