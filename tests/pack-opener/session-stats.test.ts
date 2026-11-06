import { describe, expect, it } from "bun:test";
import { generatePack } from "@fabkit/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "@fabkit/apps/pack-opener/pack/odds";
import { mulberry32 } from "@fabkit/apps/pack-opener/pack/rng";
import { computeSessionStats } from "@fabkit/apps/pack-opener/stats/session-stats";

describe("session stats", () => {
	const pack = generatePack(DEFAULT_PACK_CONFIG, mulberry32(21));
	const records = [{ setCode: DEFAULT_PACK_CONFIG.id, cards: pack }];

	it("counts what was shown when a redraw changed the rarity", () => {
		const stats = computeSessionStats(
			records,
			() => DEFAULT_PACK_CONFIG,
			() => "majestic",
		);
		expect(stats.bySet[0].rarities).toHaveLength(1);
		expect(stats.bySet[0].rarities[0].rarity).toBe("majestic");
		expect(stats.bySet[0].rarities[0].pulled).toBe(pack.length);
	});
});
