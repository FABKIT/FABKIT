import { describe, expect, it } from "bun:test";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";
import { REAL_SET_PACK_CONFIGS } from "../../src/apps/pack-opener/pack/set-configs";
import { expectedRarityCounts } from "../../src/apps/pack-opener/stats/session-stats";
import type { CardRarity } from "../../src/shared/config/cards/rarities";

/**
 * Frequency calibration, per the execution plan, section 5.2: for every
 * config derived from a set's published *frequency* numbers (rather than
 * a literal slot count), simulate a large number of packs and assert the
 * observed rate of each rarity matches what LSS actually published,
 * within a stated tolerance. This is the only defence against a
 * plausible-looking config that is quietly wrong — see that section for
 * why it's treated as non-optional.
 *
 * N = 200,000 packs per set. Tolerance is +-20% of the published rate,
 * generous enough not to be flaky (most of these rates are well above
 * zero, so sampling noise at this N is small relative to 20%) but tight
 * enough to catch a real derivation error — a mistake in the four-step
 * method (see set-configs.ts's per-set comments) typically shifts a rate
 * by 2x or more, not by a few percent.
 */

const N = 200_000;
const TOLERANCE = 0.2;

function simulateRatePerPack(setCode: string, rarity: CardRarity): number {
	const config = REAL_SET_PACK_CONFIGS[setCode];
	const rng = mulberry32(1);
	let total = 0;
	for (let i = 0; i < N; i++) {
		const pack = generatePack(config, rng);
		total += pack.filter((c) => c.rarity === rarity).length;
	}
	return total / N;
}

function expectRate(setCode: string, rarity: CardRarity, published: number) {
	const observed = simulateRatePerPack(setCode, rarity);
	expect(observed).toBeGreaterThan(published * (1 - TOLERANCE));
	expect(observed).toBeLessThan(published * (1 + TOLERANCE));
}

describe("frequency calibration", () => {
	// Welcome to Rathe: collectors-centre states Rare 1.75/pack, Super Rare
	// 1/6, Majestic 1/12, Legendary 1/96 — see set-configs.ts's WTR comment
	// for how Legendary (folded entirely into the Equipment slot) and the
	// others (population-weighted across the 2 rare-or-higher slots) were
	// derived from these numbers.
	it("Welcome to Rathe matches its published rates", () => {
		expectRate("WTR", "rare", 1.75);
		expectRate("WTR", "superrare", 1 / 6);
		expectRate("WTR", "majestic", 1 / 12);
		expectRate("WTR", "legendary", 1 / 96);
	});

	// Arcane Rising: identical published rates to Welcome to Rathe.
	it("Arcane Rising matches its published rates", () => {
		expectRate("ARC", "rare", 1.75);
		expectRate("ARC", "superrare", 1 / 6);
		expectRate("ARC", "majestic", 1 / 12);
		expectRate("ARC", "legendary", 1 / 96);
	});

	// Crucible of War: Rare 1.75/pack, Majestic 1/4, Legendary 1/240.
	it("Crucible of War matches its published rates", () => {
		expectRate("CRU", "rare", 1.75);
		expectRate("CRU", "majestic", 1 / 4);
		expectRate("CRU", "legendary", 1 / 240);
	});

	// Monarch: Rare 1.75/pack, Majestic 1/4, Legendary 1/96.
	it("Monarch matches its published rates", () => {
		expectRate("MON", "rare", 1.75);
		expectRate("MON", "majestic", 1 / 4);
		expectRate("MON", "legendary", 1 / 96);
	});

	// Tales of Aria: Rare 1.75/pack, Majestic 1/4, Legendary 1/88.
	it("Tales of Aria matches its published rates", () => {
		expectRate("ELE", "rare", 1.75);
		expectRate("ELE", "majestic", 1 / 4);
		expectRate("ELE", "legendary", 1 / 88);
	});

	// Outsiders: collectors-centre gives Rare 1.75/pack, Majestic 1/5,
	// Legendary 1/70 (Rainbow Foil) — see set-configs.ts's OUT comment for
	// how the published "1-2 Rare or higher" range was resolved into
	// these two slots.
	it("Outsiders matches its published rates", () => {
		expectRate("OUT", "rare", 1.75);
		expectRate("OUT", "majestic", 1 / 5);
		expectRate("OUT", "legendary", 1 / 70);
		expectRate("OUT", "token", 1.75);
	});

	// Everfest: 1.65 Rare, 1 Majestic per 4 packs, 1 Legendary per 160,
	// all three carried by the pack's two Rare-or-higher slots.
	it("Everfest matches its published rates", () => {
		expectRate("EVR", "rare", 1.65);
		expectRate("EVR", "majestic", 1 / 4);
		expectRate("EVR", "legendary", 1 / 160);
	});

	// History Pack 1: Majestic is published as "1 per 3.15 packs", the one
	// set that states a Majestic rate to two decimals rather than as a
	// round fraction. Fabled and Marvel are Black Label only, so neither is
	// reachable from a booster and neither is asserted.
	it("History Pack 1 matches its published rates", () => {
		expectRate("1HP", "rare", 1.65);
		expectRate("1HP", "majestic", 1 / 3.15);
		expectRate("1HP", "legendary", 1 / 82);
	});

	// Uprising: Legendary is published twice, as Rainbow Foil 1 per 80 and
	// Cold Foil 1 per 220. The engine draws the rarity once and applies
	// foiling separately, so the Rainbow rate is the one to match.
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

	// Bright Lights: the same shape as the Heavy Hitters family but the one
	// set of that generation whose page publishes no Premium Foil
	// breakdown, so its Legendary rate is the only rate that slot carries.
	it("Bright Lights matches its published rates", () => {
		expectRate("EVO", "rare", 1.68);
		expectRate("EVO", "majestic", 1 / 4);
		expectRate("EVO", "legendary", 1 / 70);
		expectRate("EVO", "token", 1.8);
	});

	// Heavy Hitters, Part the Mistveil, Rosetta and The Hunted publish the
	// same base and Premium Foil blocks, differing only in the Token rate
	// (and in whether Marvel has a published number). A pack holds one of
	// each block, so a rarity listed in both is asserted as the sum.
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

	// Heavy Hitters and Part the Mistveil are the only two of that family
	// to publish a Marvel rate; Rosetta and The Hunted print "1 per ???"
	// and carry the estimate instead, which is not a published figure and
	// so is deliberately not asserted here.
	// Every set whose Marvel rate LSS has published. The rest carry
	// ESTIMATED_MARVEL_CHANCE, which is not a published figure and so is
	// deliberately not asserted anywhere.
	it("the published Marvel rates are matched", () => {
		expectRate("HVY", "marvel", 1 / 192);
		expectRate("MST", "marvel", 1 / 100);
		expectRate("SEA", "marvel", 1 / 60);
		expectRate("UPR", "marvel", 1 / 110);
		expectRate("DYN", "marvel", 1 / 96);
		expectRate("DTD", "marvel", 1 / 100);
		expectRate("OUT", "marvel", 1 / 390);
	});

	// Compendium of Rathe. Its Collectors Centre breakdown renders behind
	// JavaScript tabs and was read off the live page by hand rather than
	// scraped, which is why this set arrived after the rest.
	it("Compendium of Rathe matches its published rates", () => {
		expectRate("PEN", "common", 5 + 18 / 24);
		expectRate("PEN", "rare", 2.55 + 5 / 24);
		expectRate("PEN", "majestic", 1 / 3.15 + 1 / 24);
		expectRate("PEN", "legendary", 1 / 140);
		expectRate("PEN", "marvel", 1 / 96);
	});

	// Omens of the Third Age, same provenance. Majestic here is the sum of
	// the two published expansion-content rates (Set 1 per 8, Expansion
	// 1 per 7) plus the premium slot's 1 per 42: this set publishes no
	// standalone Majestic rate of its own.
	it("Omens of the Third Age matches its published rates", () => {
		expectRate("OMN", "common", 11 + 18 / 24);
		expectRate("OMN", "rare", 1.88 + 5.5 / 24);
		expectRate("OMN", "majestic", 1 / 8 + 1 / 7 + 1 / 42);
		expectRate("OMN", "legendary", 1 / 96);
		expectRate("OMN", "basic", 1.8);
	});

	// Super Slam. Majestic is not asserted: its base breakdown lists 42
	// Majestics with no rate at all, and the only published Majestic rate
	// is the Premium Foil slot's 1 per 22. The set's expansion-slot content
	// (Set 1 per 8, Expansion 1 per 6) is Majestic rarity in the card data,
	// so the engine's Majestic total is those two plus the premium rate,
	// and there is no single published number to compare it against.
	it("Super Slam matches its published rates", () => {
		expectRate("SUP", "rare", 1.42 + 4 / 24);
		expectRate("SUP", "superrare", 1 / 2.18 + 1 / 13);
		expectRate("SUP", "legendary", 1 / 94);
		// Observed rather than published: about 10 Majestics per 24-pack
		// display. See set-configs.ts's SUP comment.
		expectRate("SUP", "majestic", 10 / 24);
	});

	// High Seas: the first set modelled entirely from its Collectors Centre
	// page, base block plus the Premium Foil slot's own breakdown. A pack
	// holds one of each, so the published rate for a rarity listed in both
	// is the sum of the two — see set-configs.ts's SEA comment for why that
	// second block is read as one card's distribution rather than as extra
	// pack-wide rates. Fabled is not asserted because it is not published.
	it("High Seas matches its published rates", () => {
		expectRate("SEA", "common", 11 + 18 / 24);
		expectRate("SEA", "rare", 1.83 + 5 / 24);
		expectRate("SEA", "majestic", 1 / 4 + 1 / 18);
		expectRate("SEA", "legendary", 1 / 96);
		expectRate("SEA", "marvel", 1 / 60);
	});
});

/**
 * The pull-rates dialog and the session summary don't simulate — they read
 * stats/session-stats.ts's expectedRarityCounts, which works the weights
 * out analytically. Nothing checked that the analytic path agrees with the
 * engine that actually deals the cards, so a config could be right in the
 * dialog and wrong in the pack, or the reverse. This closes that gap for
 * every set at once.
 */
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
 * Fabled is the one rarity with no published rate anywhere: every
 * Collectors Centre page prints "1 per ??? packs" for it. It is set at half
 * the set's own Marvel chance (pack/published-rates.ts's
 * FABLED_SHARE_OF_MARVEL) so a set's single rarest card stays reachable
 * instead of being unpullable, which is what it was before. There is
 * nothing published to calibrate against, so this asserts the rule rather
 * than a source: that it is drawn at all, and at half of Marvel.
 */
describe("Fabled", () => {
	for (const [code, config] of Object.entries(REAL_SET_PACK_CONFIGS)) {
		if (config.fabledChance <= 0) continue;
		it(`${code} deals a Fabled at half its Marvel rate`, () => {
			const observed = simulateRatePerPack(code, "fabled");
			expect(observed).toBeGreaterThan(0);
			expect(Math.abs(observed - config.fabledChance)).toBeLessThan(0.004);
		});
	}

	// The two sets that must never deal one: History Pack 1's Fabled cards
	// are Black Label product rather than booster content, and Compendium
	// of Rathe prints none at all.
	it("is never dealt by the two sets whose boosters have none", () => {
		expect(simulateRatePerPack("1HP", "fabled")).toBe(0);
		expect(simulateRatePerPack("PEN", "fabled")).toBe(0);
	});
});
