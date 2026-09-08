import { describe, expect, it } from "bun:test";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";
import { REAL_SET_PACK_CONFIGS } from "../../src/apps/pack-opener/pack/set-configs";
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
});
