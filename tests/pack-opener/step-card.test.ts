import { beforeEach, describe, expect, it } from "bun:test";
import { generatePack } from "@fabkit/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "@fabkit/apps/pack-opener/pack/odds";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { selectActiveIndex } from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { mulberry32 } from "@fabkit/shared/random";
import { resetStore } from "./reset-store";

/** Built with setState rather than openPack(), which pulls in texture
 * preloading that assumes a browser (see reset-session.test.ts). */
describe("stepping through a finished pack", () => {
	const pack = generatePack(DEFAULT_PACK_CONFIG, mulberry32(11));
	const lastIndex = pack.length - 1;
	const activeIndex = () => selectActiveIndex(usePackOpenerStore.getState());

	beforeEach(() => {
		resetStore({
			phase: "done",
			pack,
			revealIndex: lastIndex,
			packSetCode: DEFAULT_PACK_CONFIG.id,
		});
	});

	it("starts from the last revealed card and moves both ways", () => {
		const { stepCard } = usePackOpenerStore.getState();
		stepCard(-1);
		expect(activeIndex()).toBe(lastIndex - 1);
		stepCard(-1);
		expect(activeIndex()).toBe(lastIndex - 2);
		stepCard(1);
		expect(activeIndex()).toBe(lastIndex - 1);
	});

	it("stops at both ends of the pack", () => {
		const { stepCard, revisitCard } = usePackOpenerStore.getState();
		stepCard(1);
		expect(activeIndex()).toBe(lastIndex);
		revisitCard(0);
		stepCard(-1);
		expect(activeIndex()).toBe(0);
	});

	it("turns a flipped card back to its front", () => {
		usePackOpenerStore.setState({ showingOtherFace: true });
		usePackOpenerStore.getState().stepCard(-1);
		expect(usePackOpenerStore.getState().showingOtherFace).toBe(false);
	});

	it("does nothing while the pack is still being revealed", () => {
		usePackOpenerStore.setState({ phase: "revealing", revealIndex: 3 });
		usePackOpenerStore.getState().stepCard(1);
		const state = usePackOpenerStore.getState();
		expect(state.revealIndex).toBe(3);
		expect(state.revisitIndex).toBeNull();
	});
});
