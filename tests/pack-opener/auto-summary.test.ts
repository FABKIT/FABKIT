import { beforeEach, describe, expect, it } from "bun:test";
import { LAST_CARD_AUTO_SUMMARY_MS } from "../../src/apps/pack-opener/config/scene";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "../../src/apps/pack-opener/pack/odds";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";
import { usePackOpenerStore } from "../../src/apps/pack-opener/stores/pack-opener";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reaching the final card used to require one more tap that revealed
 * nothing — the card was already on screen, so the tap only dismissed it.
 * It now hands over to the summary on its own after a beat. The guard that
 * matters is that the automatic hand-over and a manual tap can never both
 * record the same pack.
 */
describe("automatic hand-over on the last card", () => {
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

	/** Puts the store one advance away from the final card. */
	function parkBeforeLastCard() {
		const pack = generatePack(DEFAULT_PACK_CONFIG, mulberry32(11));
		usePackOpenerStore.setState({
			phase: "revealing",
			pack,
			revealIndex: pack.length - 2,
			// Comfortably older than ADVANCE_DEBOUNCE_MS so advanceReveal isn't
			// swallowed as a double-tap.
			phaseStartedAt: Date.now() - 1000,
			packSetCode: DEFAULT_PACK_CONFIG.id,
		});
		return pack;
	}

	it("shows the summary on its own once the last card has been up a while", async () => {
		const pack = parkBeforeLastCard();
		usePackOpenerStore.getState().advanceReveal();

		// Still on the last card, not done yet.
		expect(usePackOpenerStore.getState().phase).toBe("revealing");
		expect(usePackOpenerStore.getState().revealIndex).toBe(pack.length - 1);

		await sleep(LAST_CARD_AUTO_SUMMARY_MS + 400);

		const state = usePackOpenerStore.getState();
		expect(state.phase).toBe("done");
		expect(state.packsOpenedThisSession).toBe(1);
		expect(state.openedPacksThisSession).toHaveLength(1);
	});

	it("never records the pack twice when the player taps before the wait is up", async () => {
		parkBeforeLastCard();
		usePackOpenerStore.getState().advanceReveal(); // onto the last card

		// Tap again straight away to finish by hand, which is what the
		// pending automatic hand-over must not duplicate.
		usePackOpenerStore.setState({ phaseStartedAt: Date.now() - 1000 });
		usePackOpenerStore.getState().advanceReveal();
		expect(usePackOpenerStore.getState().phase).toBe("done");
		expect(usePackOpenerStore.getState().packsOpenedThisSession).toBe(1);

		await sleep(LAST_CARD_AUTO_SUMMARY_MS + 400);

		const state = usePackOpenerStore.getState();
		expect(state.packsOpenedThisSession).toBe(1);
		expect(state.openedPacksThisSession).toHaveLength(1);
	});
});

/**
 * "Next Pack" hands the player a fresh closed pack and waits. It used to
 * call openPack() straight out of the summary, which tore the new pack
 * open by itself: the one thing the player came to do was happening TO
 * them, and the new pack front was on screen for a fraction of a second
 * before the tear started.
 */
describe("readyAnotherPack", () => {
	it("returns to idle with a pack to tap rather than opening one", () => {
		const store = usePackOpenerStore.getState();
		store.openPack(DEFAULT_PACK_CONFIG);
		const pack = usePackOpenerStore.getState().pack;
		expect(pack).not.toBeNull();
		// Skip the tear's own timeout; this is about what happens after the
		// last card, not about how the pack got opened.
		usePackOpenerStore.setState({ phase: "revealing", revealIndex: 0 });
		for (let i = 0; i < (pack?.length ?? 0) + 1; i++) {
			usePackOpenerStore.setState({ phaseStartedAt: 0 });
			usePackOpenerStore.getState().advanceReveal();
		}
		expect(usePackOpenerStore.getState().phase).toBe("done");

		usePackOpenerStore.getState().readyAnotherPack();
		const after = usePackOpenerStore.getState();
		expect(after.phase).toBe("idle");
		expect(after.pack).toBeNull();
		expect(after.revealIndex).toBe(-1);
		expect(after.revisitIndex).toBeNull();
		expect(after.showingOtherFace).toBe(false);
	});

	it("does nothing unless a pack has actually finished", () => {
		usePackOpenerStore.setState({ phase: "revealing" });
		usePackOpenerStore.getState().readyAnotherPack();
		expect(usePackOpenerStore.getState().phase).toBe("revealing");
	});
});
