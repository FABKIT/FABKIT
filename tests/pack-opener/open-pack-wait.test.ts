import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { DEFAULT_PACK_CONFIG } from "@fabkit/apps/pack-opener/pack/odds";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";

/**
 * A pack dealt before its set's printings arrive resolves against an empty
 * pool, and each surface resolves at a different moment, so the reveal and the
 * ledger could disagree about what was pulled. openPack() waits for them
 * instead, and these pin down the edges of that wait.
 *
 * Each test uses a different set code, because a printings file that has been
 * loaded stays cached for the life of the module.
 */
describe("opening a pack before its set has loaded", () => {
	const realFetch = globalThis.fetch;
	let release: (response: Response) => void;
	let fetchCalls = 0;

	beforeEach(() => {
		fetchCalls = 0;
		globalThis.fetch = (() => {
			fetchCalls += 1;
			return new Promise<Response>((resolve) => {
				release = resolve;
			});
		}) as unknown as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = realFetch;
	});

	function park(selectedSet: string): void {
		usePackOpenerStore.setState({
			phase: "idle",
			pack: null,
			selectedSet,
			packSetCode: null,
		});
	}

	const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
	const printings = () =>
		new Response(JSON.stringify({ code: "x", printings: [] }));

	it("waits for the printings, then deals", async () => {
		park("WTR");
		usePackOpenerStore.getState().openPack();
		expect(usePackOpenerStore.getState().phase).toBe("idle");

		release(printings());
		await settle();

		const state = usePackOpenerStore.getState();
		expect(state.phase).toBe("tearing");
		expect(state.packSetCode).toBe("WTR");
	});

	it("still deals when the printings fail to load", async () => {
		park("ARC");
		usePackOpenerStore.getState().openPack();

		release(new Response("", { status: 500 }));
		await settle();

		expect(usePackOpenerStore.getState().phase).toBe("tearing");
	});

	it("treats a second tap during the wait as the same request", async () => {
		park("CRU");
		const { openPack } = usePackOpenerStore.getState();
		openPack();
		openPack();
		expect(fetchCalls).toBe(1);

		release(printings());
		await settle();

		expect(usePackOpenerStore.getState().phase).toBe("tearing");
	});

	it("abandons the deal when the player switches set during the wait", async () => {
		park("MON");
		usePackOpenerStore.getState().openPack();
		const pending = release;

		usePackOpenerStore.getState().selectSet("ELE");
		pending(printings());
		await settle();

		const state = usePackOpenerStore.getState();
		expect(state.phase).toBe("idle");
		expect(state.pack).toBeNull();
	});

	it("deals immediately for the mock config, which has nothing to load", () => {
		park(DEFAULT_PACK_CONFIG.id);
		usePackOpenerStore.getState().openPack(DEFAULT_PACK_CONFIG);
		expect(usePackOpenerStore.getState().phase).toBe("tearing");
		expect(fetchCalls).toBe(0);
	});
});
