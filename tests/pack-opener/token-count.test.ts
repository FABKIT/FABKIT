import { describe, expect, it } from "bun:test";
import { guaranteedTokenCount } from "@fabkit/apps/pack-opener/pack/pull-rates";
import { REAL_SET_PACK_CONFIGS } from "@fabkit/apps/pack-opener/pack/set-configs";

/** The printed card count on a real booster is the pack's cards WITHOUT its
 * token; fabtcg.com's product pages include it. SetInfoDialog.tsx shows the
 * printed number with the token beside it, derived from these slots, and
 * the whole point of deriving it is that it cannot drift from the engine.
 *
 * Welcome to Rathe is the anchor case: fabtcg says 16, its wrapper says
 * "15-Card Booster Pack", and 16 minus its 1 token slot is 15. */
describe("guaranteedTokenCount", () => {
	it("leaves a set with no token slot at its published count", () => {
		// High Seas and Omen declare no token slot at all, so their printed
		// count and fabtcg's should be the same number.
		for (const code of ["SEA", "OMN"]) {
			expect(guaranteedTokenCount(REAL_SET_PACK_CONFIGS[code])).toBe(0);
		}
	});

	it("subtracts the single token slot for Welcome to Rathe", () => {
		const config = REAL_SET_PACK_CONFIGS.WTR;
		expect(guaranteedTokenCount(config)).toBe(1);
		// The number actually printed on the pack Louis uploaded.
		expect(config.cardsPerPack - guaranteedTokenCount(config)).toBe(15);
	});

	it("does not count a token-or-wildcard slot as a guaranteed token", () => {
		// The Heavy Hitters family declares 1 token AND 1 token-or-wildcard.
		// Only the first is always a token; the second can be a real card, so
		// subtracting both would understate the pack.
		const config = REAL_SET_PACK_CONFIGS.HVY;
		expect(config.slots.some((slot) => slot.kind === "token-or-wildcard")).toBe(
			true,
		);
		expect(guaranteedTokenCount(config)).toBe(1);
		expect(config.cardsPerPack - guaranteedTokenCount(config)).toBe(15);
	});

	it("never subtracts more cards than a pack has", () => {
		for (const [code, config] of Object.entries(REAL_SET_PACK_CONFIGS)) {
			const printed = config.cardsPerPack - guaranteedTokenCount(config);
			expect(printed, `${code} printed count`).toBeGreaterThan(0);
			expect(printed, `${code} printed count`).toBeLessThanOrEqual(
				config.cardsPerPack,
			);
		}
	});
});
