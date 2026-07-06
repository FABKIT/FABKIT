import { describe, expect, it } from "bun:test";
import { getDailyPuzzle } from "../../src/apps/fabble/game/daily";
import { dayBefore, localDateKey } from "../../src/apps/fabble/game/date";
import { fabbleDataset } from "./fixtures/dataset";

describe("getDailyPuzzle", () => {
	it("returns the fixture's entry for a known date", () => {
		const puzzle = getDailyPuzzle(
			"standard",
			fabbleDataset,
			new Date(2026, 5, 2),
		);
		const expected = fabbleDataset.schedule.standard.find(
			(e) => e.date === "2026-06-02",
		);
		expect(puzzle?.answerId).toBe(expected?.cardId);
	});

	it("passes theme through for theme days", () => {
		const puzzle = getDailyPuzzle(
			"standard",
			fabbleDataset,
			new Date(2026, 5, 1),
		);
		expect(puzzle?.theme).toEqual({ kind: "equipment" });
	});

	it("returns null for a missing date", () => {
		const puzzle = getDailyPuzzle(
			"standard",
			fabbleDataset,
			new Date(2099, 0, 1),
		);
		expect(puzzle).toBeNull();
	});

	it("resolves chaos independently from standard", () => {
		const standard = getDailyPuzzle(
			"standard",
			fabbleDataset,
			new Date(2026, 5, 1),
		);
		const chaos = getDailyPuzzle("chaos", fabbleDataset, new Date(2026, 5, 1));
		expect(chaos?.theme).toBeNull();
		expect(standard?.answerId).not.toBe(undefined);
	});
});

describe("localDateKey", () => {
	it("zero-pads month and day", () => {
		expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
	});
});

describe("dayBefore", () => {
	it("handles a plain day", () => {
		expect(dayBefore("2026-07-05")).toBe("2026-07-04");
	});

	it("handles a month boundary", () => {
		expect(dayBefore("2026-07-01")).toBe("2026-06-30");
	});

	it("handles a year boundary", () => {
		expect(dayBefore("2026-01-01")).toBe("2025-12-31");
	});
});
