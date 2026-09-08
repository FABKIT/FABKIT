import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { clearCardTextureCache } from "@fabkit/apps/pack-opener/components/scene/textures/useCardTexture";
import {
	ADVANCE_DEBOUNCE_MS,
	TEAR_DURATION_MS,
	TEAR_TAIL_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { generatePack } from "@fabkit/apps/pack-opener/pack/generate-pack";
import { getPackConfig } from "@fabkit/apps/pack-opener/pack/odds";
import { orderForReveal } from "@fabkit/apps/pack-opener/pack/reveal-order";
import type {
	DrawnCard,
	PackConfig,
} from "@fabkit/apps/pack-opener/pack/types";
import { trackEvent } from "@fabkit/platform/analytics";
import { useTexture } from "@react-three/drei";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** Kicks off loading every card's real image up front, right as the pack is
 * generated — the ~1.5s tear animation gives them a head start, so by the
 * time each card becomes active its texture is (usually) already cached
 * and Card3D's useTexture() doesn't suspend mid-reveal. */
function preloadPackTextures(pack: DrawnCard[]): void {
	for (const drawn of pack) {
		const imageUrl = activeCardResolver.resolve(drawn).imageUrl;
		if (imageUrl) useTexture.preload(imageUrl);
	}
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
	packsOpenedThisSession: number;
	/** Set code driving getPackConfig() for the next openPack() call, and
	 * shown by SetCarousel — null until the carousel picks a default (the
	 * set index hasn't loaded yet, or nothing was ever stored). See
	 * SELECTED_SET_STORAGE_KEY below for the persisted value. */
	selectedSet: string | null;
}

export interface PackOpenerActions {
	openPack(config?: PackConfig): void;
	advanceReveal(): void;
	/** Switches the active set — persists the choice and resets to idle so
	 * a stale pack/summary from the previous set never lingers on screen. */
	selectSet(setCode: string): void;
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
	packsOpenedThisSession: 0,
	selectedSet: readStoredSelectedSet(),
};

export const usePackOpenerStore = create<PackOpenerState & PackOpenerActions>()(
	devtools((set, get) => ({
		...initialState,

		openPack(config) {
			const { phase, selectedSet } = get();
			if (phase !== "idle" && phase !== "done") return;

			const packConfig = config ?? getPackConfig(selectedSet ?? undefined);
			clearCardTextureCache();
			const pack = orderForReveal(generatePack(packConfig));
			preloadPackTextures(pack);
			set(
				{ phase: "tearing", pack, revealIndex: -1, phaseStartedAt: Date.now() },
				undefined,
				"pack-opener/openPack",
			);
			trackEvent({ name: "pack_opener_pack_opened" });

			setTimeout(() => {
				if (get().phase !== "tearing" || get().pack !== pack) return;
				set(
					{ phase: "revealing", revealIndex: 0, phaseStartedAt: Date.now() },
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
			}, TEAR_DURATION_MS + TEAR_TAIL_MS);
		},

		advanceReveal() {
			const { phase, pack, revealIndex, phaseStartedAt } = get();
			if (phase !== "revealing" || !pack) return;
			if (
				phaseStartedAt !== null &&
				Date.now() - phaseStartedAt < ADVANCE_DEBOUNCE_MS
			) {
				return;
			}

			const nextIndex = revealIndex + 1;
			if (nextIndex >= pack.length) {
				set(
					{
						phase: "done",
						packsOpenedThisSession: get().packsOpenedThisSession + 1,
					},
					undefined,
					"pack-opener/packCompleted",
				);
				trackEvent({ name: "pack_opener_pack_completed" });
				return;
			}

			set(
				{ revealIndex: nextIndex, phaseStartedAt: Date.now() },
				undefined,
				"pack-opener/advanceReveal",
			);
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
			const { phase, selectedSet } = get();
			if (setCode === selectedSet) return;
			// The carousel is hidden during tearing/revealing (see
			// SetCarousel.tsx), so this shouldn't fire mid-animation — guarded
			// anyway rather than trusting the UI layer alone.
			if (phase === "tearing" || phase === "revealing") return;

			writeStoredSelectedSet(setCode);
			set(
				{
					selectedSet: setCode,
					phase: "idle",
					pack: null,
					revealIndex: -1,
					phaseStartedAt: null,
				},
				undefined,
				"pack-opener/selectSet",
			);
		},
	})),
);
