import { describe, expect, it } from "bun:test";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "../../src/apps/pack-opener/pack/odds";
import { mulberry32 } from "../../src/apps/pack-opener/pack/rng";

describe("generatePack", () => {
	it("always returns exactly cardsPerPack cards", () => {
		const rng = mulberry32(1);
		for (let i = 0; i < 200; i++) {
			const pack = generatePack(DEFAULT_PACK_CONFIG, rng);
			expect(pack.length).toBe(DEFAULT_PACK_CONFIG.cardsPerPack);
		}
	});

	it("always has exactly one premium-foil slot and it is always foil", () => {
		const config = { ...DEFAULT_PACK_CONFIG, coldFoilChance: 0 };
		const rng = mulberry32(2);
		for (let i = 0; i < 200; i++) {
			const pack = generatePack(config, rng);
			const premiumCards = pack.filter((c) => c.slot === "premium-foil");
			expect(premiumCards.length).toBe(1);
			expect(premiumCards[0].foil).toBe(true);
			const foilCount = pack.filter((c) => c.foil).length;
			expect(foilCount).toBe(1);
		}
	});

	it("guaranteed-rare-plus slot is never common/basic/token", () => {
		const rng = mulberry32(3);
		for (let i = 0; i < 200; i++) {
			const pack = generatePack(DEFAULT_PACK_CONFIG, rng);
			const guaranteed = pack.find((c) => c.slot === "guaranteed-rare-plus");
			expect(guaranteed).toBeDefined();
			expect(["common", "basic", "token"]).not.toContain(guaranteed?.rarity);
		}
	});

	it("never produces marvel when marvelChance is 0", () => {
		const config = { ...DEFAULT_PACK_CONFIG, marvelChance: 0 };
		const rng = mulberry32(4);
		for (let i = 0; i < 500; i++) {
			const pack = generatePack(config, rng);
			expect(pack.some((c) => c.marvel)).toBe(false);
		}
	});

	it("always upgrades a non-premium slot to foil when coldFoilChance is 1", () => {
		const config = { ...DEFAULT_PACK_CONFIG, coldFoilChance: 1 };
		const rng = mulberry32(5);
		for (let i = 0; i < 200; i++) {
			const pack = generatePack(config, rng);
			const nonPremiumFoil = pack.filter(
				(c) => c.slot !== "premium-foil" && c.foil,
			);
			expect(nonPremiumFoil.length).toBe(1);
		}
	});

	it("keeps cold foil and marvel rates within a wide tolerance of configured odds", () => {
		const rng = mulberry32(6);
		const n = 50000;
		let extraFoilCount = 0;
		let marvelCount = 0;
		for (let i = 0; i < n; i++) {
			const pack = generatePack(DEFAULT_PACK_CONFIG, rng);
			if (pack.some((c) => c.slot !== "premium-foil" && c.foil)) {
				extraFoilCount++;
			}
			if (pack.some((c) => c.marvel)) {
				marvelCount++;
			}
		}
		const observedFoilRate = extraFoilCount / n;
		const observedMarvelRate = marvelCount / n;
		expect(observedFoilRate).toBeGreaterThan(
			DEFAULT_PACK_CONFIG.coldFoilChance * 0.5,
		);
		expect(observedFoilRate).toBeLessThan(
			DEFAULT_PACK_CONFIG.coldFoilChance * 1.5,
		);
		expect(observedMarvelRate).toBeGreaterThan(
			DEFAULT_PACK_CONFIG.marvelChance * 0.25,
		);
		expect(observedMarvelRate).toBeLessThan(
			DEFAULT_PACK_CONFIG.marvelChance * 2,
		);
	});
});
