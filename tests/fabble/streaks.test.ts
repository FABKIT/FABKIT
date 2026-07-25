import { describe, expect, it } from "bun:test";
import {
	applyResult,
	recordEndlessWin,
	resetEndlessStreak,
} from "../../src/apps/fabble/game/streaks";
import type {
	PersistedEndlessStreak,
	PersistedStreaks,
} from "../../src/apps/fabble/types";

function makeStreaks(overrides: Partial<PersistedStreaks>): PersistedStreaks {
	return {
		schema: 1,
		current: 0,
		best: 0,
		lastResultDate: null,
		lastResult: null,
		...overrides,
	};
}

describe("applyResult", () => {
	it("win after a win yesterday increments the streak", () => {
		const prev = makeStreaks({
			current: 3,
			best: 5,
			lastResultDate: "2026-07-04",
			lastResult: "won",
		});
		const next = applyResult(prev, "won", "2026-07-05", "2026-07-04");
		expect(next.current).toBe(4);
		expect(next.best).toBe(5);
	});

	it("win after skipping a day resets the streak to 1", () => {
		const prev = makeStreaks({
			current: 3,
			best: 5,
			lastResultDate: "2026-07-02",
			lastResult: "won",
		});
		const next = applyResult(prev, "won", "2026-07-05", "2026-07-04");
		expect(next.current).toBe(1);
	});

	it("win after a loss yesterday resets the streak to 1", () => {
		const prev = makeStreaks({
			current: 0,
			best: 5,
			lastResultDate: "2026-07-04",
			lastResult: "lost",
		});
		const next = applyResult(prev, "won", "2026-07-05", "2026-07-04");
		expect(next.current).toBe(1);
	});

	it("a loss resets current to 0 and keeps best", () => {
		const prev = makeStreaks({ current: 4, best: 4 });
		const next = applyResult(prev, "lost", "2026-07-05", "2026-07-04");
		expect(next.current).toBe(0);
		expect(next.best).toBe(4);
	});

	it("best only ever rises", () => {
		const prev = makeStreaks({ current: 2, best: 6 });
		const next = applyResult(prev, "won", "2026-07-05", "2026-07-04");
		expect(next.best).toBe(6);
	});

	it("is idempotent for the same day", () => {
		const prev = makeStreaks({
			current: 3,
			best: 3,
			lastResultDate: "2026-07-05",
			lastResult: "won",
		});
		const next = applyResult(prev, "lost", "2026-07-05", "2026-07-04");
		expect(next).toEqual(prev);
	});
});

function makeEndlessStreak(
	overrides: Partial<PersistedEndlessStreak>,
): PersistedEndlessStreak {
	return {
		schema: 1,
		current: 0,
		best: 0,
		completedLog: [],
		...overrides,
	};
}

describe("recordEndlessWin", () => {
	it("increments current and appends a log entry", () => {
		const prev = makeEndlessStreak({ current: 2, best: 2 });
		const next = recordEndlessWin(prev, "card-a", 4);
		expect(next.current).toBe(3);
		expect(next.completedLog).toEqual([{ answerId: "card-a", guessCount: 4 }]);
	});

	it("raises best only when the new current exceeds it", () => {
		const prev = makeEndlessStreak({ current: 5, best: 5 });
		const next = recordEndlessWin(prev, "card-a", 1);
		expect(next.best).toBe(6);

		const prevHighBest = makeEndlessStreak({ current: 0, best: 9 });
		const nextHighBest = recordEndlessWin(prevHighBest, "card-b", 3);
		expect(nextHighBest.current).toBe(1);
		expect(nextHighBest.best).toBe(9);
	});

	it("preserves prior log entries in order", () => {
		const prev = makeEndlessStreak({
			current: 1,
			completedLog: [{ answerId: "card-a", guessCount: 2 }],
		});
		const next = recordEndlessWin(prev, "card-b", 5);
		expect(next.completedLog).toEqual([
			{ answerId: "card-a", guessCount: 2 },
			{ answerId: "card-b", guessCount: 5 },
		]);
	});
});

describe("resetEndlessStreak", () => {
	it("resets current and the log, but keeps best", () => {
		const prev = makeEndlessStreak({
			current: 7,
			best: 10,
			completedLog: [{ answerId: "card-a", guessCount: 2 }],
		});
		const next = resetEndlessStreak(prev);
		expect(next.current).toBe(0);
		expect(next.best).toBe(10);
		expect(next.completedLog).toEqual([]);
	});
});
