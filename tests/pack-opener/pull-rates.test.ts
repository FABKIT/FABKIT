import { describe, expect, it } from "bun:test";
import { DEFAULT_PACK_CONFIG } from "../../src/apps/pack-opener/pack/odds";
import {
	PERCENT_DISPLAY_THRESHOLD,
	percentOfPack,
	pullRateRows,
} from "../../src/apps/pack-opener/pack/pull-rates";
import { REAL_SET_PACK_CONFIGS } from "../../src/apps/pack-opener/pack/set-configs";

describe("pullRateRows", () => {
	it("orders rows most common to rarest", () => {
		const rows = pullRateRows(DEFAULT_PACK_CONFIG);
		for (let i = 1; i < rows.length; i++) {
			expect(rows[i - 1].expectedPerPack).toBeGreaterThanOrEqual(
				rows[i].expectedPerPack,
			);
		}
	});

	it("never includes a rarity with zero expected count", () => {
		for (const row of pullRateRows(DEFAULT_PACK_CONFIG)) {
			expect(row.expectedPerPack).toBeGreaterThan(0);
		}
	});

	it("every real set's rows sum to that set's own cardsPerPack", () => {
		for (const config of Object.values(REAL_SET_PACK_CONFIGS)) {
			const total = pullRateRows(config).reduce(
				(sum, row) => sum + row.expectedPerPack,
				0,
			);
			expect(total).toBeCloseTo(config.cardsPerPack, 5);
		}
	});

	it("percentOfPack matches PERCENT_DISPLAY_THRESHOLD's own crossover point", () => {
		// Uprising's Legendary row is a fraction of a pack — well under the
		// 1% display threshold, so it should read as "1 in N packs" rather
		// than a percentage (see SetInfoDialog.tsx's own rendering logic,
		// which switches on exactly this comparison).
		const config = REAL_SET_PACK_CONFIGS.UPR;
		const legendary = pullRateRows(config).find(
			(row) => row.rarity === "legendary",
		);
		expect(legendary).toBeDefined();
		if (!legendary) return;
		expect(percentOfPack(legendary, config)).toBeLessThan(
			PERCENT_DISPLAY_THRESHOLD,
		);

		// Common, by contrast, should comfortably clear the threshold in
		// every real set — it's the bulk of every pack.
		const common = pullRateRows(config).find((row) => row.rarity === "common");
		expect(common).toBeDefined();
		if (!common) return;
		expect(percentOfPack(common, config)).toBeGreaterThan(
			PERCENT_DISPLAY_THRESHOLD,
		);
	});
});
