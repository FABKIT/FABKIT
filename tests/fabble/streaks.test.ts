import { describe, expect, it } from "bun:test";
import { applyResult } from "../../src/apps/fabble/game/streaks";
import type { PersistedStreaks } from "../../src/apps/fabble/types";

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
