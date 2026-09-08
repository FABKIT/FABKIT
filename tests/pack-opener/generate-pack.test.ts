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

	it("always has exactly one premium-foil slot and it is always Rainbow Foil", () => {
		const config = { ...DEFAULT_PACK_CONFIG, coldFoilChance: 0 };
		const rng = mulberry32(2);
		for (let i = 0; i < 200; i++) {
			const pack = generatePack(config, rng);
			const premiumCards = pack.filter((c) => c.slot === "premium-foil");
			expect(premiumCards.length).toBe(1);
			expect(premiumCards[0].treatment).toBe("rainbow");
			const foiledCount = pack.filter((c) => c.treatment !== "standard").length;
			expect(foiledCount).toBe(1);
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
			expect(pack.some((c) => c.rarity === "marvel")).toBe(false);
		}
	});

	it("always upgrades exactly one eligible card to Cold Foil when coldFoilChance is 1", () => {
		const config = { ...DEFAULT_PACK_CONFIG, coldFoilChance: 1 };
		const rng = mulberry32(5);
		for (let i = 0; i < 200; i++) {
			const pack = generatePack(config, rng);
			// Exclude the premium slot: it's never eligible for this upgrade
			// (fixedTreatment "rainbow", or "cold" on the rare marvel roll),
			// so counting it in would make this flaky on the ~1/2000 packs
			// where marvel also fires.
			const coldFoiled = pack.filter(
				(c) => c.slot !== "premium-foil" && c.treatment === "cold",
			);
			expect(coldFoiled.length).toBe(1);
		}
	});

	it("keeps cold foil and marvel rates within a wide tolerance of configured odds", () => {
		const rng = mulberry32(6);
		const n = 50000;
		let extraFoilCount = 0;
		let marvelCount = 0;
		for (let i = 0; i < n; i++) {
			const pack = generatePack(DEFAULT_PACK_CONFIG, rng);
			if (
				pack.some((c) => c.slot !== "premium-foil" && c.treatment === "cold")
			) {
				extraFoilCount++;
			}
			if (pack.some((c) => c.rarity === "marvel")) {
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
