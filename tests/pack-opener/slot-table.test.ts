import { describe, expect, it } from "bun:test";
import { REAL_SET_PACK_CONFIGS } from "../../src/apps/pack-opener/pack/set-configs";
import { slotTable } from "../../src/apps/pack-opener/pack/slot-table";

/**
 * pack/published-rates.ts exists to be edited by hand, which makes a
 * hand-edited rate the most likely way this breaks. generatePack's
 * weightedPick sums a table for its total and walks it subtracting, so a
 * negative weight does not throw: it silently skews the distribution and
 * can hand back the wrong entry. These are the tests that keep that from
 * being possible.
 */
describe("slotTable", () => {
	it("gives the filler whatever the listed rates leave", () => {
		const table = slotTable(
			"test slot",
			[{ rarity: "majestic", perPack: 0.25 }],
			"rare",
		);
		const total = table.reduce((sum, entry) => sum + entry.weight, 0);
		const majestic = table.find((entry) => entry.rarity === "majestic");
		expect(majestic?.weight ?? 0).toBeCloseTo(total * 0.25, 0);
	});

	it("splits a rate across a multi-draw slot", () => {
		const table = slotTable(
			"test slot",
			[{ rarity: "token", perPack: 1.75 }],
			"common",
			2,
		);
		const total = table.reduce((sum, entry) => sum + entry.weight, 0);
		const token = table.find((entry) => entry.rarity === "token");
		expect(token?.weight ?? 0).toBeCloseTo(total * 0.875, 0);
	});

	it("carries the filler's own extras, for the Equipment slots", () => {
		const table = slotTable(
			"test slot",
			[{ rarity: "legendary", perPack: 1 / 96, requiresType: "Equipment" }],
			{ rarity: "common", requiresType: "Equipment" },
		);
		expect(table.every((entry) => entry.requiresType === "Equipment")).toBe(
			true,
		);
	});

	it("throws when a slot's rates add up to more than one card", () => {
		expect(() =>
			slotTable(
				"an over-full slot",
				[
					{ rarity: "majestic", perPack: 0.8 },
					{ rarity: "rare", perPack: 0.5 },
				],
				"common",
			),
		).toThrow(/over-full slot.*more than one card/s);
	});
});

describe("every real set's derived weights", () => {
	for (const [code, config] of Object.entries(REAL_SET_PACK_CONFIGS)) {
		it(`${code} has no negative or empty rarity table`, () => {
			for (const slot of config.slots) {
				expect(slot.rarityTable.length).toBeGreaterThan(0);
				const total = slot.rarityTable.reduce(
					(sum, entry) => sum + entry.weight,
					0,
				);
				expect(total).toBeGreaterThan(0);
				for (const entry of slot.rarityTable) {
					expect(entry.weight).toBeGreaterThanOrEqual(0);
				}
			}
		});
	}
});
