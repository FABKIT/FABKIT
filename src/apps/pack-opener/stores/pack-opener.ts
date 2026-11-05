import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import {
	clearFailedTextureUrls,
	trimSafeTextureCache,
} from "@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture";
import {
	ADVANCE_DEBOUNCE_MS,
	LAST_CARD_AUTO_SUMMARY_MS,
	TEAR_DURATION_MS,
	TEAR_START_DELAY_MS,
	TEAR_TAIL_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { rollPackArt } from "@fabkit/apps/pack-opener/lib/pack-art";
import {
	readStoredCurrency,
	readStoredSelectedSet,
	writeStoredCurrency,
	writeStoredSelectedSet,
} from "@fabkit/apps/pack-opener/lib/pack-opener-storage";
import {
	preloadLookaheadCount,
	preloadPackTextures,
} from "@fabkit/apps/pack-opener/lib/preload-pack";
import { warmPrices } from "@fabkit/apps/pack-opener/lib/pricing";
import { defaultSet } from "@fabkit/apps/pack-opener/lib/set-index";
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
import { devtools } from "zustand/middleware";

/** How many decoded card textures survive into the next pack: this pack's and
 * most of the previous one's, so a repeat card is instant without the cache
 * growing for as long as the session runs. */
const TEXTURE_CACHE_KEEP = 64;

const initialState: PackOpenerState = {
	phase: "idle",
	pack: null,
	revealIndex: -1,
	phaseStartedAt: null,
	revealStartedAt: null,
	showingOtherFace: false,
	openedPacksThisSession: [],
	selectedSet: readStoredSelectedSet(),
	currency: readStoredCurrency(),
	pricesVersion: 0,
	packArtUrl: null,
	revisitIndex: null,
	packSetCode: null,
};

/** Reports the card as the player sees it. A cold upgrade can redraw into a
 * different rarity, so the drawn card's own rarity may not be what's shown. */
function trackCardRevealed(card: DrawnCard, setCode: string | null): void {
	const shown = activeCardResolver.resolve(card, setCode ?? undefined);
	trackEvent({
		name: "pack_opener_card_revealed",
		data: { rarity: shown.rarity, treatment: shown.treatment },
	});
}

export const usePackOpenerStore = create<PackOpenerState & PackOpenerActions>()(
	devtools((set, get) => {
		/** The open tap currently waiting on a set's printings. Identity is
		 * the point: switching sets or resetting clears it, and a load that
		 * finishes after that finds it is no longer the live request. */
		let pendingOpen: { setCode: string } | null = null;

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

		/** Ends the pack and hands over to the summary. Shared by the last
		 * tap and by the automatic hand-over on the final card (see
		 * LAST_CARD_AUTO_SUMMARY_MS), so both paths record the pack into
		 * session stats identically rather than one of them drifting. */
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

				const packConfig = config ?? getPackConfig(selectedSet ?? undefined);
				const isCached =
					packConfig === DEFAULT_PACK_CONFIG ||
					getSetPrintings(packConfig.id).length > 0;
				if (isCached) {
					pendingOpen = null;
					dealPack(packConfig);
					return;
				}

				// A pack dealt before its set's printings arrive resolves some
				// cards against a pool that isn't there yet, and each surface
				// resolves at a different moment, so the reveal and the ledger
				// could disagree about what was pulled. A second tap while this
				// waits is the same request, not another pack.
				if (pendingOpen?.setCode === packConfig.id) return;
				const request = { setCode: packConfig.id };
				pendingOpen = request;
				loadSetPrintings(packConfig.id)
					.catch(() => {})
					.then(() => {
						if (pendingOpen !== request) return;
						pendingOpen = null;
						if (get().phase === "idle") dealPack(packConfig);
					});
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
				// already preloaded when the pack was dealt or by an earlier call
				// here, so only the new topmost index needs fetching.
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
				trackCardRevealed(pack[nextIndex], packSetCode);
			},

			selectSet(setCode) {
				const { selectedSet } = get();
				if (setCode === selectedSet) return;
				// The carousel stays visible during tearing/revealing (see
				// SetCarousel.tsx) so a player can switch sets mid-pack. That is a
				// deliberate, user-facing decision, not something this store should
				// silently allow or silently block: SetCarousel gates the call
				// behind LeavePackDialog, which warns that an in-flight pack is
				// discarded and does not count toward session stats, before ever
				// calling this action. This action itself stays unconditional —
				// it already resets pack/phase/revealIndex cleanly below, which is
				// exactly "discard the pack" — so there is nothing else to guard
				// here once the UI has confirmed the player wants that.
				pendingOpen = null;
				const packArtUrl = rollPackArt(setCode);
				warmSet(setCode);

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

				// A stored code the index no longer lists counts as no choice at
				// all. Left in place, it would show the default set's logo while
				// its packs came from the mock config.
				const current =
					sets.find((entry) => entry.code === selectedSet) ?? defaultSet(sets);
				if (!current) return;
				if (current.code !== selectedSet) writeStoredSelectedSet(current.code);

				warmSet(current.code);
				set(
					{ selectedSet: current.code, packArtUrl: rollPackArt(current.code) },
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
				// than landing somewhere new. selectedSet is explicitly kept
				// rather than reset to initialState's value, which would re-read
				// the set from localStorage, and the artwork is re-rolled for
				// that same set rather than dropping back to the mock pack.
				pendingOpen = null;
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
						// Rolled HERE rather than at the tap, so the player sees
						// which pack front they are about to open. openPack() keeps
						// whatever art is on screen, so the two do not fight.
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
