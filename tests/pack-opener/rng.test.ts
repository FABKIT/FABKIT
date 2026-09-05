import { describe, expect, it } from "bun:test";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";

describe("mulberry32", () => {
	it("is deterministic for a fixed seed", () => {
		const a = mulberry32(42);
		const b = mulberry32(42);
		const seqA = Array.from({ length: 10 }, () => a());
		const seqB = Array.from({ length: 10 }, () => b());
		expect(seqA).toEqual(seqB);
	});

	it("produces values in [0, 1)", () => {
		const rng = mulberry32(1234);
		for (let i = 0; i < 1000; i++) {
			const value = rng();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it("differs across seeds", () => {
		const a = mulberry32(1)();
		const b = mulberry32(2)();
		expect(a).not.toBe(b);
	});
});
