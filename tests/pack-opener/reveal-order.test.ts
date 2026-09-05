import { describe, expect, it } from "bun:test";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "../../src/apps/pack-opener/pack/odds";
import { orderForReveal } from "../../src/apps/pack-opener/pack/reveal-order";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";

describe("orderForReveal", () => {
	it("always places the premium-foil card last", () => {
		const rng = mulberry32(7);
		for (let i = 0; i < 200; i++) {
			const pack = generatePack(DEFAULT_PACK_CONFIG, rng);
			const ordered = orderForReveal(pack, rng);
			expect(ordered[ordered.length - 1].slot).toBe("premium-foil");
		}
	});

	it("preserves the exact multiset of card ids", () => {
		const rng = mulberry32(8);
		const pack = generatePack(DEFAULT_PACK_CONFIG, rng);
		const ordered = orderForReveal(pack, rng);
		expect(ordered.length).toBe(pack.length);
		expect(new Set(ordered.map((c) => c.id))).toEqual(
			new Set(pack.map((c) => c.id)),
		);
	});
});
