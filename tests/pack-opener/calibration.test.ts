import { describe, expect, it } from "bun:test";
import { generatePack } from "@fabkit/apps/pack-opener/pack/generate-pack";
import { expectedRarityCounts } from "@fabkit/apps/pack-opener/pack/pull-rates";
import { REAL_SET_PACK_CONFIGS } from "@fabkit/apps/pack-opener/pack/set-configs";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import { mulberry32 } from "@fabkit/shared/random";

/**
 * Frequency calibration: simulate N packs per set and assert each rarity's observed
 * rate matches the published rate within TOLERANCE. Published rates and their
 * sources live in pack/published-rates.ts.
 */

const N = 200_000;
const TOLERANCE = 0.2;

/** One seeded simulation per set; every assertion reads from the same run. */
const histograms = new Map<string, Map<CardRarity, number>>();

function histogramFor(setCode: string): Map<CardRarity, number> {
	const cached = histograms.get(setCode);
	if (cached) return cached;
	const config = REAL_SET_PACK_CONFIGS[setCode];
	const rng = mulberry32(1);
	const counts = new Map<CardRarity, number>();
	for (let i = 0; i < N; i++) {
		for (const card of generatePack(config, rng, () => "")) {
			counts.set(card.rarity, (counts.get(card.rarity) ?? 0) + 1);
		}
	}
	histograms.set(setCode, counts);
	return counts;
}

function simulateRatePerPack(setCode: string, rarity: CardRarity): number {
	return (histogramFor(setCode).get(rarity) ?? 0) / N;
}

function expectRate(setCode: string, rarity: CardRarity, published: number) {
	const observed = simulateRatePerPack(setCode, rarity);
	expect(observed).toBeGreaterThan(published * (1 - TOLERANCE));
	expect(observed).toBeLessThan(published * (1 + TOLERANCE));
}

describe("frequency calibration", () => {
	// Published rates live in pack/published-rates.ts.
	it("Welcome to Rathe matches its published rates", () => {
		expectRate("WTR", "rare", 1.75);
		expectRate("WTR", "superrare", 1 / 6);
		expectRate("WTR", "majestic", 1 / 12);
		expectRate("WTR", "legendary", 1 / 96);
	});

	it("Arcane Rising matches its published rates", () => {
		expectRate("ARC", "rare", 1.75);
		expectRate("ARC", "superrare", 1 / 6);
		expectRate("ARC", "majestic", 1 / 12);
		expectRate("ARC", "legendary", 1 / 96);
	});

	it("Crucible of War matches its published rates", () => {
		expectRate("CRU", "rare", 1.75);
		expectRate("CRU", "majestic", 1 / 4);
		expectRate("CRU", "legendary", 1 / 240);
	});

	it("Monarch matches its published rates", () => {
		expectRate("MON", "rare", 1.75);
		expectRate("MON", "majestic", 1 / 4);
		expectRate("MON", "legendary", 1 / 96);
	});

	it("Tales of Aria matches its published rates", () => {
		expectRate("ELE", "rare", 1.75);
		expectRate("ELE", "majestic", 1 / 4);
		expectRate("ELE", "legendary", 1 / 88);
	});

	it("Outsiders matches its published rates", () => {
		expectRate("OUT", "rare", 1.75);
		expectRate("OUT", "majestic", 1 / 5);
		expectRate("OUT", "legendary", 1 / 70);
		expectRate("OUT", "token", 1.75);
	});

	it("Everfest matches its published rates", () => {
		expectRate("EVR", "rare", 1.65);
		expectRate("EVR", "majestic", 1 / 4);
		expectRate("EVR", "legendary", 1 / 160);
	});

	// Fabled and Marvel are Black Label only, so not asserted.
	it("History Pack 1 matches its published rates", () => {
		expectRate("1HP", "rare", 1.65);
		expectRate("1HP", "majestic", 1 / 3.15);
		expectRate("1HP", "legendary", 1 / 82);
	});

	// Legendary is published as Rainbow Foil 1 per 80 and Cold Foil 1 per 220; foiling is applied separately, so match Rainbow.
	it("Uprising matches its published rates", () => {
		expectRate("UPR", "rare", 1.75);
		expectRate("UPR", "majestic", 1 / 4);
		expectRate("UPR", "legendary", 1 / 80);
		expectRate("UPR", "token", 1.75);
	});

	it("Dynasty matches its published rates", () => {
		expectRate("DYN", "rare", 1.75);
		expectRate("DYN", "majestic", 1 / 4);
		expectRate("DYN", "legendary", 1 / 88);
	});

	it("Dusk till Dawn matches its published rates", () => {
		expectRate("DTD", "rare", 1.68);
		expectRate("DTD", "majestic", 1 / 4);
		expectRate("DTD", "legendary", 1 / 64);
	});

	// No Premium Foil breakdown published, so Legendary is the only rate that slot carries.
	it("Bright Lights matches its published rates", () => {
		expectRate("EVO", "rare", 1.68);
		expectRate("EVO", "majestic", 1 / 4);
		expectRate("EVO", "legendary", 1 / 70);
		expectRate("EVO", "token", 1.8);
	});

	// Same base and premium blocks, differing in Token rate; rarities in both blocks are asserted as the sum.
	const hvyFamily: Array<[string, number]> = [
		["HVY", 1.85],
		["MST", 1.84],
		["ROS", 1.54],
		["HNT", 1.54],
	];
	for (const [code, tokenRate] of hvyFamily) {
		it(`${code} matches its published rates`, () => {
			expectRate(code, "common", 11 + 18 / 24);
			expectRate(code, "rare", 1.83 + 5 / 24);
			expectRate(code, "majestic", 1 / 4 + 1 / 18);
			expectRate(code, "legendary", 1 / 96);
			expectRate(code, "token", tokenRate);
		});
	}

	// Only published Marvel rates are asserted; the rest use ESTIMATED_MARVEL_CHANCE.
	it("the published Marvel rates are matched", () => {
		expectRate("HVY", "marvel", 1 / 192);
		expectRate("MST", "marvel", 1 / 100);
		expectRate("SEA", "marvel", 1 / 60);
		expectRate("UPR", "marvel", 1 / 110);
		expectRate("DYN", "marvel", 1 / 96);
		expectRate("DTD", "marvel", 1 / 100);
		expectRate("OUT", "marvel", 1 / 390);
	});

	it("Compendium of Rathe matches its published rates", () => {
		expectRate("PEN", "common", 5 + 18 / 24);
		expectRate("PEN", "rare", 2.55 + 5 / 24);
		expectRate("PEN", "majestic", 1 / 3.15 + 1 / 24);
		expectRate("PEN", "legendary", 1 / 140);
		expectRate("PEN", "marvel", 1 / 96);
	});

	// Majestic is Set + Expansion + premium: no standalone rate is published.
	it("Omens of the Third Age matches its published rates", () => {
		expectRate("OMN", "common", 11 + 18 / 24);
		expectRate("OMN", "rare", 1.88 + 5.5 / 24);
		expectRate("OMN", "majestic", 1 / 8 + 1 / 7 + 1 / 42);
		expectRate("OMN", "legendary", 1 / 96);
		expectRate("OMN", "basic", 1.8);
	});

	// IAR has no Collectors Centre page yet and borrows Omens' rates, so this guards the derivation only.
	it("Usurp the Shadow Throne matches its borrowed (Omens) rates", () => {
		expectRate("IAR", "common", 11 + 18 / 24);
		expectRate("IAR", "rare", 1.88 + 5.5 / 24);
		expectRate("IAR", "majestic", 1 / 8 + 1 / 7 + 1 / 42);
		expectRate("IAR", "legendary", 1 / 96);
		expectRate("IAR", "basic", 1.8);
	});

	// Majestic here is Set + Expansion + premium; no single published figure covers it, so it is asserted below as observed.
	it("Super Slam matches its published rates", () => {
		expectRate("SUP", "rare", 1.42 + 4 / 24);
		expectRate("SUP", "superrare", 1 / 2.18 + 1 / 13);
		expectRate("SUP", "legendary", 1 / 94);
		// Observed, not published.
		expectRate("SUP", "majestic", 10 / 24);
	});

	// A pack holds one card of the premium block, so rarities in both blocks are asserted as the sum.
	it("High Seas matches its published rates", () => {
		expectRate("SEA", "common", 11 + 18 / 24);
		expectRate("SEA", "rare", 1.83 + 5 / 24);
		expectRate("SEA", "majestic", 1 / 4 + 1 / 18);
		expectRate("SEA", "legendary", 1 / 96);
		expectRate("SEA", "marvel", 1 / 60);
	});
});

/** The analytic expectedRarityCounts (pull-rates dialog, session summary) must agree with the engine. */
describe("expected counts agree with the engine", () => {
	for (const [code, config] of Object.entries(REAL_SET_PACK_CONFIGS)) {
		it(`${code}'s stated expectations match what it deals`, () => {
			const expected = expectedRarityCounts(config);
			for (const [rarity, count] of Object.entries(expected)) {
				if (!count) continue;
				const observed = simulateRatePerPack(code, rarity as CardRarity);
				// Absolute floor alongside the relative one: a rarity at
				// 1-in-2000 packs is dominated by sampling noise at this N,
				// where a few tenths of a percent of a pack is not a defect.
				expect(Math.abs(observed - count)).toBeLessThan(
					Math.max(count * TOLERANCE, 0.01),
				);
			}
		});
	}
});

/**
 * Antiquity Pack: LSS's "Estimated Rarity Breakdown". LSS counts all 10 cards of
 * its Rare slot as Rare but the data files 6 as Common, so that slot is asserted
 * across both rarities together.
 */
describe("Antiquity Pack", () => {
	it("matches its published rarity breakdown", () => {
		expectRate("ANQ", "majestic", 1);
		expectRate("ANQ", "legendary", 1 / 20);
		expectRate("ANQ", "fabled", 1 / 45);
		expectRate("ANQ", "marvel", 1 / 800);
	});

	it("deals its 10-card Rare slot once per pack", () => {
		const rares =
			simulateRatePerPack("ANQ", "rare") + simulateRatePerPack("ANQ", "common");
		expect(rares).toBeGreaterThan(0.9);
		expect(rares).toBeLessThan(1);
	});

	it("deals exactly two cards, the puzzle slot being unmodelled", () => {
		expect(REAL_SET_PACK_CONFIGS.ANQ.cardsPerPack).toBe(2);
		expect(generatePack(REAL_SET_PACK_CONFIGS.ANQ, mulberry32(5))).toHaveLength(
			2,
		);
	});
});

/**
 * Fabled has no published rate (pages print "1 per ??? packs"), so this asserts
 * the rule: it is dealt, at half the set's Marvel chance.
 */
describe("Fabled", () => {
	for (const [code, config] of Object.entries(REAL_SET_PACK_CONFIGS)) {
		if (config.fabledChance <= 0) continue;
		it(`${code} deals a Fabled at its configured rate`, () => {
			const observed = simulateRatePerPack(code, "fabled");
			expect(observed).toBeGreaterThan(0);
			expect(Math.abs(observed - config.fabledChance)).toBeLessThan(0.004);
		});
	}

	// 1HP's Fabled cards are Black Label only; Compendium of Rathe prints none.
	it("is never dealt by the two sets whose boosters have none", () => {
		expect(simulateRatePerPack("1HP", "fabled")).toBe(0);
		expect(simulateRatePerPack("PEN", "fabled")).toBe(0);
	});
});
