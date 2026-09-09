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

	it("defaults to 3 when navigator.connection doesn't exist at all (e.g. Safari)", () => {
		setConnection(undefined);
		expect(preloadLookaheadCount()).toBe(3);
	});

	it("defaults to 3 on a normal connection", () => {
		setConnection({ saveData: false, effectiveType: "4g" });
		expect(preloadLookaheadCount()).toBe(3);
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

	it("stays at 3 on 3g (only 2g-class and Data Saver are reduced)", () => {
		setConnection({ saveData: false, effectiveType: "3g" });
		expect(preloadLookaheadCount()).toBe(3);
	});
});
