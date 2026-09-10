import { afterEach, describe, expect, it } from "bun:test";
import { preloadLookaheadCount } from "../../src/apps/pack-opener/stores/pack-opener";

/** Restores `navigator.connection` to whatever it was before each test —
 * most environments (including this one, by default) have no `connection`
 * at all, which is itself one of the cases under test (Safari never has
 * it, and that must fall back to the normal lookahead, not a slow-device
 * assumption). */
function setConnection(value: unknown): void {
	Object.defineProperty(navigator, "connection", {
		value,
		configurable: true,
	});
}

describe("preloadLookaheadCount", () => {
	afterEach(() => {
		setConnection(undefined);
	});

	// "The whole pack" rather than a specific number: preloadPackTextures
	// clamps to the pack's length, so anything at or above 16 means the same
	// thing. The test asserts the intent, not the sentinel.
	const WHOLE_PACK = 16;

	it("preloads the whole pack when navigator.connection doesn't exist at all (e.g. Safari)", () => {
		setConnection(undefined);
		expect(preloadLookaheadCount()).toBeGreaterThanOrEqual(WHOLE_PACK);
	});

	it("preloads the whole pack on a normal connection", () => {
		setConnection({ saveData: false, effectiveType: "4g" });
		expect(preloadLookaheadCount()).toBeGreaterThanOrEqual(WHOLE_PACK);
	});

	it("drops to 1 when the visitor has Data Saver on", () => {
		setConnection({ saveData: true, effectiveType: "4g" });
		expect(preloadLookaheadCount()).toBe(1);
	});

	it("drops to 1 on a 2g-class connection", () => {
		setConnection({ saveData: false, effectiveType: "2g" });
		expect(preloadLookaheadCount()).toBe(1);
	});

	it("drops to 1 on a slow-2g connection", () => {
		setConnection({ saveData: false, effectiveType: "slow-2g" });
		expect(preloadLookaheadCount()).toBe(1);
	});

	it("uses a middle lookahead on 3g: ahead of the player, but not sixteen at once", () => {
		setConnection({ saveData: false, effectiveType: "3g" });
		const count = preloadLookaheadCount();
		expect(count).toBeLessThan(WHOLE_PACK);
		// Still has to stay ahead of a player tapping at the debounce floor.
		expect(count).toBeGreaterThan(3);
	});
});
