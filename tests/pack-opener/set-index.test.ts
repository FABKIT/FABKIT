import { describe, expect, it } from "bun:test";
import {
	defaultSet,
	selectedSetPosition,
	stepSetCode,
} from "@fabkit/apps/pack-opener/lib/set-index";
import type { SetIndexEntry } from "@fabkit/shared/data/fab-printings";

function entry(
	code: string,
	productKind: SetIndexEntry["productKind"],
): SetIndexEntry {
	return { code, productKind } as SetIndexEntry;
}

/** The index lists supplemental products after every booster set, by name. */
const SETS = [
	entry("WTR", "booster-set"),
	entry("IAR", "booster-set"),
	entry("GEM1", "supplemental"),
	entry("MPW", "supplemental"),
];

describe("the default set", () => {
	it("is the newest booster, not whichever supplemental sorts last", () => {
		expect(defaultSet(SETS)?.code).toBe("IAR");
	});

	it("falls back to the last entry when no booster is listed", () => {
		expect(defaultSet([entry("MPW", "supplemental")])?.code).toBe("MPW");
	});

	it("is nothing at all for an empty index", () => {
		expect(defaultSet([])).toBeUndefined();
	});
});

describe("the selected position", () => {
	it("finds a set the index knows", () => {
		expect(selectedSetPosition(SETS, "GEM1")).toBe(2);
	});

	it("treats an unknown code as no selection", () => {
		expect(selectedSetPosition(SETS, "RETIRED")).toBe(1);
		expect(selectedSetPosition(SETS, null)).toBe(1);
	});
});

describe("stepping between sets", () => {
	it("wraps at both ends", () => {
		expect(stepSetCode(SETS, "WTR", -1)).toBe("MPW");
		expect(stepSetCode(SETS, "MPW", 1)).toBe("WTR");
	});

	it("steps from the default when the selection is unknown", () => {
		expect(stepSetCode(SETS, "RETIRED", 1)).toBe("GEM1");
		expect(stepSetCode(SETS, null, -1)).toBe("WTR");
	});
});
