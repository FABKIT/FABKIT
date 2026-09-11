import { beforeEach, describe, expect, it } from "bun:test";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "../../src/apps/pack-opener/pack/odds";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";
import { usePackOpenerStore } from "../../src/apps/pack-opener/stores/pack-opener";

/**
 * resetSession() throws a run away, and the two things it must NOT throw
 * away with it are the selected set and the currency preference — both are
 * settings the player chose, not part of the run. Getting that wrong is
 * silent and annoying rather than loud: the set would spring back to
 * whatever localStorage held and the pack front would drop to the mock
 * one, which is exactly what spreading the store's initialState would do.
 *
 * Builds the "finished pack" state with setState rather than by calling
 * openPack(), for the same reason switch-set.test.ts does: openPack pulls
 * in texture preloading that assumes a browser.
 */
describe("resetting the session", () => {
	beforeEach(() => {
		usePackOpenerStore.setState({
			phase: "idle",
			pack: null,
			revealIndex: -1,
			phaseStartedAt: null,
			packsOpenedThisSession: 0,
			openedPacksThisSession: [],
			selectedSet: DEFAULT_PACK_CONFIG.id,
			currency: "USD",
			packArtUrl: null,
			revisitIndex: null,
			packSetCode: null,
		});
	});

	it("clears the session ledger and returns to a closed pack", () => {
		const pack = generatePack(DEFAULT_PACK_CONFIG, mulberry32(11));
		usePackOpenerStore.setState({
			phase: "done",
			pack,
			revealIndex: pack.length - 1,
			revisitIndex: 2,
			packSetCode: DEFAULT_PACK_CONFIG.id,
			packsOpenedThisSession: 3,
			openedPacksThisSession: [
				{ setCode: DEFAULT_PACK_CONFIG.id, cards: pack },
				{ setCode: DEFAULT_PACK_CONFIG.id, cards: pack },
				{ setCode: DEFAULT_PACK_CONFIG.id, cards: pack },
			],
		});

		usePackOpenerStore.getState().resetSession();

		const state = usePackOpenerStore.getState();
		expect(state.packsOpenedThisSession).toBe(0);
		expect(state.openedPacksThisSession).toEqual([]);
		expect(state.phase).toBe("idle");
		expect(state.pack).toBeNull();
		expect(state.revealIndex).toBe(-1);
		expect(state.revisitIndex).toBeNull();
		expect(state.packSetCode).toBeNull();
	});

	it("keeps the chosen set and currency", () => {
		usePackOpenerStore.setState({
			selectedSet: "DTD",
			currency: "EUR",
			packsOpenedThisSession: 2,
		});

		usePackOpenerStore.getState().resetSession();

		const state = usePackOpenerStore.getState();
		expect(state.selectedSet).toBe("DTD");
		expect(state.currency).toBe("EUR");
	});

	it("switches currency without disturbing the session", () => {
		usePackOpenerStore.setState({ packsOpenedThisSession: 4 });

		usePackOpenerStore.getState().setCurrency("EUR");

		expect(usePackOpenerStore.getState().currency).toBe("EUR");
		expect(usePackOpenerStore.getState().packsOpenedThisSession).toBe(4);
	});
});
