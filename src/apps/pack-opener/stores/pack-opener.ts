import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { clearCardTextureCache } from "@fabkit/apps/pack-opener/components/scene/textures/useCardTexture";
import {
	ADVANCE_DEBOUNCE_MS,
	TEAR_DURATION_MS,
	TEAR_TAIL_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { generatePack } from "@fabkit/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "@fabkit/apps/pack-opener/pack/odds";
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
}

export interface PackOpenerActions {
	openPack(config?: PackConfig): void;
	advanceReveal(): void;
}

const initialState: PackOpenerState = {
	phase: "idle",
	pack: null,
	revealIndex: -1,
	phaseStartedAt: null,
	packsOpenedThisSession: 0,
};

export const usePackOpenerStore = create<PackOpenerState & PackOpenerActions>()(
	devtools((set, get) => ({
		...initialState,

		openPack(config = DEFAULT_PACK_CONFIG) {
			const { phase } = get();
			if (phase !== "idle" && phase !== "done") return;

			clearCardTextureCache();
			const pack = orderForReveal(generatePack(config));
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
						foil: revealed.foil,
						marvel: revealed.marvel,
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
					foil: revealed.foil,
					marvel: revealed.marvel,
				},
			});
		},
	})),
);
