import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	resolveTreatment,
	selectPrintingPool,
} from "../../src/apps/pack-opener/cards/card-resolver";
import { hashToIndex } from "../../src/apps/pack-opener/cards/deterministic-hash";
import { generatePack } from "../../src/apps/pack-opener/pack/generate-pack";
import { REAL_SET_PACK_CONFIGS } from "../../src/apps/pack-opener/pack/set-configs";
import type { DrawnCard } from "../../src/apps/pack-opener/pack/types";
import type {
	FabPrinting,
	FabSetPrintings,
} from "../../src/shared/data/fab-printings";

const DATA_DIR = join(process.cwd(), "public", "data", "pack-opener", "sets");

function loadPrintings(code: string): FabPrinting[] {
	const raw = readFileSync(join(DATA_DIR, `${code}.json`), "utf-8");
	return (JSON.parse(raw) as FabSetPrintings).printings;
}

function printing(overrides: Partial<FabPrinting>): FabPrinting {
	return {
		id: "TST001",
		uniqueId: "u",
		name: "Test",
		rarity: "common",
		foiling: "standard",
		expansionSlot: false,
		tcgplayerProductId: null,
		pitch: null,
		cost: null,
		power: null,
		defense: null,
		types: [],
		artVariations: [],
		artSlug: null,
		backSlug: null,
		...overrides,
	};
}

function drawn(overrides: Partial<DrawnCard>): DrawnCard {
	return {
		id: "d",
		slot: "common",
		rarity: "common",
		treatment: "standard",
		expansionSlot: false,
		...overrides,
	};
}

describe("selectPrintingPool", () => {
	it("keeps a standard draw on standard printings, ignoring the set's foil ones", () => {
		const pool = selectPrintingPool(
			[
				printing({ id: "A", foiling: "standard" }),
				printing({ id: "B", foiling: "rainbow" }),
				printing({ id: "C", foiling: "cold" }),
			],
			drawn({ treatment: "standard" }),
		);
		expect(pool.map((p) => p.id)).toEqual(["A"]);
	});

	it("keeps a rainbow draw on rainbow printings", () => {
		const pool = selectPrintingPool(
			[
				printing({ id: "A", foiling: "standard" }),
				printing({ id: "B", foiling: "rainbow" }),
			],
			drawn({ treatment: "rainbow" }),
		);
		expect(pool.map((p) => p.id)).toEqual(["B"]);
	});

	it("falls back to every match when the set never printed that rarity plain — the Legendary case", () => {
		const printings = [
			printing({ id: "L1", rarity: "legendary", foiling: "rainbow" }),
			printing({ id: "L2", rarity: "legendary", foiling: "cold" }),
		];
		const pool = selectPrintingPool(
			printings,
			drawn({ rarity: "legendary", treatment: "standard" }),
		);
		expect(pool.map((p) => p.id)).toEqual(["L1", "L2"]);
		// ...and that fallback is what lets the printing promote the card to
		// foil, which is the whole point of keeping it.
		expect(
			resolveTreatment(
				drawn({ rarity: "legendary", treatment: "standard" }),
				pool[0],
			),
		).toBe("rainbow");
	});
});

/**
 * The regression this whole thing exists for: a real pack holds exactly one
 * guaranteed foil, plus at most an extra when the wildcard/insert slot lands
 * a card the set only ever printed foil (a Legendary or Marvel), plus the
 * occasional published cold-foil upgrade. Before selectPrintingPool
 * preferred a matching foiling, roughly half of every pack's commons
 * resolved onto foil printings and got promoted — 6 to 8 foils a pack.
 */
describe("foils per generated pack, against real set data", () => {
	const PACKS = 300;

	for (const [code, config] of Object.entries(REAL_SET_PACK_CONFIGS)) {
		it(`${code} averages about one foil per pack`, () => {
			const printings = loadPrintings(code);
			let total = 0;
			let worst = 0;

			for (let i = 0; i < PACKS; i++) {
				let foils = 0;
				for (const card of generatePack(config)) {
					const pool = selectPrintingPool(printings, card);
					if (pool.length === 0) continue;
					const picked = pool[hashToIndex(card.id, pool.length)];
					if (resolveTreatment(card, picked) !== "standard") foils += 1;
				}
				total += foils;
				worst = Math.max(worst, foils);
			}

			const average = total / PACKS;
			expect(average).toBeLessThanOrEqual(2.5);
			expect(worst).toBeLessThanOrEqual(4);
		});
	}
});
