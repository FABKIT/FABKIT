import { beforeEach, describe, expect, it } from "bun:test";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "../../src/apps/pack-opener/pack/odds";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";
import { usePackOpenerStore } from "../../src/apps/pack-opener/stores/pack-opener";

/**
 * Louis's decision (see the execution plan, section "Louis's decisions
 * already made"): switching sets mid-pack is allowed, but the abandoned
 * pack is discarded and must NEVER be recorded into session stats — stats
 * exist to show value the player actually pulled, so counting cards they
 * never saw would be misleading. SetCarousel.tsx gates this behind
 * LeavePackDialog before ever calling selectSet(); this test covers the
 * store's own half of the contract directly, without the UI layer, so a
 * future change to the store can't quietly start counting an abandoned
 * pack even if the dialog is somehow bypassed.
 *
 * Sets state directly via setState rather than calling openPack()/
 * advanceReveal() — those pull in texture preloading (drei's useTexture,
 * three's TextureLoader) that assumes a browser Image/document, neither of
 * which this plain bun:test environment provides. Constructing the
 * "in-flight pack" state by hand keeps this test focused on selectSet()'s
 * own contract instead of depending on that machinery.
 */
describe("switching sets mid-reveal", () => {
	beforeEach(() => {
		usePackOpenerStore.setState({
			phase: "idle",
			pack: null,
			revealIndex: -1,
			phaseStartedAt: null,
			packsOpenedThisSession: 0,
			openedPacksThisSession: [],
			selectedSet: DEFAULT_PACK_CONFIG.id,
			packArtUrl: null,
			revisitIndex: null,
			packSetCode: null,
		});
	});

	it("discards an in-flight pack without recording it in session stats", () => {
		const rng = mulberry32(7);
		const pack = generatePack(DEFAULT_PACK_CONFIG, rng);

		usePackOpenerStore.setState({
			phase: "revealing",
			pack,
			revealIndex: 3,
			phaseStartedAt: Date.now(),
			packSetCode: DEFAULT_PACK_CONFIG.id,
		});

		usePackOpenerStore.getState().selectSet("some-other-set-not-in-index");

		const state = usePackOpenerStore.getState();
		expect(state.packsOpenedThisSession).toBe(0);
		expect(state.openedPacksThisSession).toEqual([]);
		expect(state.pack).toBeNull();
		expect(state.phase).toBe("idle");
		expect(state.selectedSet).toBe("some-other-set-not-in-index");
	});

	it("also discards a pack still tearing, not just one already revealing", () => {
		const rng = mulberry32(8);
		const pack = generatePack(DEFAULT_PACK_CONFIG, rng);

		usePackOpenerStore.setState({
			phase: "tearing",
			pack,
			revealIndex: -1,
			phaseStartedAt: Date.now(),
			packSetCode: DEFAULT_PACK_CONFIG.id,
		});

		usePackOpenerStore.getState().selectSet("some-other-set-not-in-index");

		const state = usePackOpenerStore.getState();
		expect(state.packsOpenedThisSession).toBe(0);
		expect(state.openedPacksThisSession).toEqual([]);
	});

	it("still lets a finished pack's stats through unaffected", () => {
		const rng = mulberry32(9);
		const pack = generatePack(DEFAULT_PACK_CONFIG, rng);

		usePackOpenerStore.setState({
			phase: "done",
			pack,
			revealIndex: pack.length - 1,
			packsOpenedThisSession: 1,
			openedPacksThisSession: [
				{ setCode: DEFAULT_PACK_CONFIG.id, cards: pack },
			],
			packSetCode: DEFAULT_PACK_CONFIG.id,
		});

		usePackOpenerStore.getState().selectSet("some-other-set-not-in-index");

		const state = usePackOpenerStore.getState();
		expect(state.packsOpenedThisSession).toBe(1);
		expect(state.openedPacksThisSession).toHaveLength(1);
	});
});
