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
import { loadSetPrices } from "@fabkit/shared/data/fab-prices";
import {
	getSetIndex,
	loadSetPrintings,
	type SetIndexEntry,
} from "@fabkit/shared/data/fab-printings";
import { useTexture } from "@react-three/drei";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** How many cards ahead of the active one to keep preloaded — see the
 * execution plan, section 5 (performance), fix 2. Loading all 16 cards at
 * once the moment a pack is generated (roughly 3-4MB) used to saturate a
 * slow connection and stall the pack opening on time; staggering this
 * keeps only a handful of ~200KB images in flight at once instead, while
 * still comfortably keeping ahead of how fast a player can actually tap
 * through reveals. */
const DEFAULT_PRELOAD_LOOKAHEAD = 3;
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
	return DEFAULT_PRELOAD_LOOKAHEAD;
}

/** Kicks off loading the real images for `count` cards starting at
 * `fromIndex` — called once with a small starting batch when a pack is
 * generated (see openPack below), then again with count 1 each time
 * advanceReveal moves the lookahead frontier forward by one card, rather
 * than loading the whole pack's ~3-4MB up front. Uses preloadSafeTexture,
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
		const imageUrl = activeCardResolver.resolve(pack[i], setCode).imageUrl;
		if (imageUrl) preloadSafeTexture(imageUrl);
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
}

const SELECTED_SET_STORAGE_KEY = "pack-opener:selected-set";

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

				const packConfig = config ?? getPackConfig(selectedSet ?? undefined);
				clearCardTextureCache();
				const pack = orderForReveal(generatePack(packConfig));
				preloadPackTextures(pack, packConfig.id, 0, preloadLookaheadCount());
				set(
					{
						phase: "tearing",
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
				const entry = getSetIndex().find((set) => set.code === setCode);
				const packArtUrl = entry ? pickPackArt(entry) : null;
				if (packArtUrl) useTexture.preload(packArtUrl);
				// Warm the set's own printing pool ahead of the next openPack()
				// call, same spirit as the pack-art preload above — see
				// card-resolver.ts's fabPrintingsCardResolver, which needs this
				// loaded to show the set's own cards rather than falling back
				// cross-set. Errors swallowed like every other loader here; a
				// slow/failed load just means that fallback kicks in instead.
				loadSetPrintings(setCode).catch(() => {});
				// Same for the price snapshot — a set with no price file (or a
				// failed fetch) just shows dashes everywhere a price would go,
				// see PackSummary.tsx and SetInfoDialog.tsx.
				loadSetPrices(setCode).catch(() => {});

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
					const url = pickPackArt(latest);
					if (url) useTexture.preload(url);
					loadSetPrintings(latest.code).catch(() => {});
					loadSetPrices(latest.code).catch(() => {});
					set(
						{ selectedSet: latest.code, packArtUrl: url },
						undefined,
						"pack-opener/initializeSetArt",
					);
					return;
				}

				// Always warm the returning visitor's already-selected set's
				// printing pool and price snapshot too, even when packArtUrl below
				// short-circuits — this runs once per mount either way (see this
				// action's own doc comment) and both loaders are idempotent per
				// set code.
				loadSetPrintings(selectedSet).catch(() => {});
				loadSetPrices(selectedSet).catch(() => {});

				const entry = sets.find((set) => set.code === selectedSet);
				const url = entry ? pickPackArt(entry) : null;
				if (url) useTexture.preload(url);
				set({ packArtUrl: url }, undefined, "pack-opener/initializeSetArt");
			},

			flipCard() {
				set(
					{ showingOtherFace: !get().showingOtherFace },
					undefined,
					"pack-opener/flipCard",
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
