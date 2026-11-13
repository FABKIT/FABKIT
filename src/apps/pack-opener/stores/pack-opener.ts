import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import {
	ADVANCE_DEBOUNCE_MS,
	LAST_CARD_AUTO_SUMMARY_MS,
	TEAR_DURATION_MS,
	TEAR_START_DELAY_MS,
	TEAR_TAIL_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { rollPackArt } from "@fabkit/apps/pack-opener/lib/pack-art";
import { createPreferenceStorage } from "@fabkit/apps/pack-opener/lib/pack-opener-storage";
import {
	preloadLookaheadCount,
	preloadPackTextures,
} from "@fabkit/apps/pack-opener/lib/preload-pack";
import { warmPrices } from "@fabkit/apps/pack-opener/lib/pricing";
import { selectedSetPosition } from "@fabkit/apps/pack-opener/lib/set-index";
import {
	clearFailedTextureUrls,
	trimSafeTextureCache,
} from "@fabkit/apps/pack-opener/lib/texture-cache";
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
import type {
	PackOpenerActions,
	PackOpenerState,
} from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { trackEvent } from "@fabkit/platform/analytics";
import {
	getSetIndex,
	getSetPrintings,
	loadSetPrintings,
} from "@fabkit/shared/data/fab-printings";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/** How many decoded textures survive into the next pack: about the last four
 * full-size packs' worth, so a repeat card is instant without the cache growing
 * for as long as the session runs. */
const TEXTURE_CACHE_KEEP = 64;

/** What survives a reload, through zustand's persist. Everything else in the
 * store belongs to the current visit. */
type PackOpenerPreferences = Pick<PackOpenerState, "selectedSet" | "currency">;

const initialState: PackOpenerState = {
	phase: "idle",
	pack: null,
	revealIndex: -1,
	phaseStartedAt: null,
	revealStartedAt: null,
	showingOtherFace: false,
	openedPacksThisSession: [],
	selectedSet: null,
	// Dollars until the visitor picks; not guessed from locale (euro means Cardmarket).
	currency: "USD",
	pricesVersion: 0,
	packArtUrl: null,
	revisitIndex: null,
	packSetCode: null,
};

/** Reports the card as the player sees it. A cold upgrade can redraw into a
 * different rarity, so the drawn card's own rarity may not be what's shown. */
function trackCardRevealed(card: DrawnCard, setCode: string | null): void {
	const shown = resolveCard(card, setCode);
	trackEvent({
		name: "pack_opener_card_revealed",
		data: { rarity: shown.rarity, treatment: shown.treatment },
	});
}

export const usePackOpenerStore = create<PackOpenerState & PackOpenerActions>()(
	devtools(
		persist(
			(set, get) => {
				/** The set an open tap is currently waiting on. Switching sets or
				 * resetting clears it, and a load that finishes after that finds it is
				 * no longer the live request. */
				let pendingOpenSet: string | null = null;

				/** Warms everything a set needs ahead of its first pack. Every loader
				 * is idempotent per set code, and a failed one only means that data
				 * stays missing: the cards fall back, and prices read "Not priced
				 * yet". */
				function warmSet(setCode: string): void {
					loadSetPrintings(setCode).catch(() => {});
					warmPrices(setCode).then(() => {
						set(
							{ pricesVersion: get().pricesVersion + 1 },
							undefined,
							"pack-opener/pricesLoaded",
						);
					});
				}

				/** Ends the pack and hands over to the summary. Shared by the last tap
				 * and the automatic hand-over (LAST_CARD_AUTO_SUMMARY_MS). */
				function completePack(pack: DrawnCard[], setCode: string | null): void {
					set(
						{
							phase: "done",
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

				function dealPack(packConfig: PackConfig): void {
					trimSafeTextureCache(TEXTURE_CACHE_KEEP);
					// A failed image gets another chance with each new pack, so a brief
					// network drop doesn't cost a card its art for the whole session.
					clearFailedTextureUrls();
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
							trackCardRevealed(pack[0], packConfig.id);
						},
						TEAR_START_DELAY_MS + TEAR_DURATION_MS + TEAR_TAIL_MS,
					);
				}

				return {
					...initialState,

					openPack(config) {
						const { phase, selectedSet } = get();
						if (phase !== "idle") return;

						const packConfig =
							config ?? getPackConfig(selectedSet ?? undefined);
						const isCached =
							packConfig === DEFAULT_PACK_CONFIG ||
							getSetPrintings(packConfig.id).length > 0;
						if (isCached) {
							pendingOpenSet = null;
							dealPack(packConfig);
							return;
						}

						// Wait for the set's printings so the reveal and the ledger resolve
						// cards against the same pool. A second tap is the same request.
						if (pendingOpenSet === packConfig.id) return;
						pendingOpenSet = packConfig.id;
						loadSetPrintings(packConfig.id)
							.catch(() => {})
							.then(() => {
								if (pendingOpenSet !== packConfig.id) return;
								pendingOpenSet = null;
								if (get().phase === "idle") dealPack(packConfig);
							});
					},

					advanceReveal() {
						const { phase, pack, revealIndex, phaseStartedAt, packSetCode } =
							get();
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
						// Advance the lookahead window; earlier cards are already preloaded.
						const frontierIndex = nextIndex + preloadLookaheadCount() - 1;
						preloadPackTextures(
							pack,
							packSetCode ?? DEFAULT_PACK_CONFIG.id,
							frontierIndex,
							1,
						);

						// Hand over to the summary on its own after a beat. Re-checks
						// state on fire instead of holding a cancellable handle.
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
						trackCardRevealed(pack[nextIndex], packSetCode);
					},

					selectSet(setCode) {
						const { selectedSet } = get();
						if (setCode === selectedSet) return;
						// Unconditional: SetCarousel gates this behind the leave-pack
						// confirmation, and the reset below discards any in-flight pack.
						pendingOpenSet = null;
						const packArtUrl = rollPackArt(setCode);
						warmSet(setCode);

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

						// A stored code the index no longer lists counts as no choice.
						const current = sets[selectedSetPosition(sets, selectedSet)];

						warmSet(current.code);
						set(
							{
								selectedSet: current.code,
								packArtUrl: rollPackArt(current.code),
							},
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
						set({ currency }, undefined, "pack-opener/setCurrency");
						trackEvent({
							name: "pack_opener_currency_changed",
							data: { currency },
						});
					},

					resetSession() {
						// Clears the session ledger and returns to a closed pack of the
						// same set (selectedSet kept, artwork re-rolled), like
						// readyAnotherPack.
						pendingOpenSet = null;
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
								// Rolled here so the player sees the pack front they will open.
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
			},
			{
				name: "pack-opener:preferences",
				storage: createPreferenceStorage<PackOpenerPreferences>(),
				partialize: ({ selectedSet, currency }) => ({ selectedSet, currency }),
			},
		),
	),
);
