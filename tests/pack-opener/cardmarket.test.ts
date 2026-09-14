import { describe, expect, it } from "bun:test";
import {
	buildCardmarketSnapshot,
	type CardmarketCatalog,
} from "../../scripts/cardmarket";
import type { FabPrinting } from "../../src/shared/data/fab-printings";

function printing(overrides: Partial<FabPrinting>): FabPrinting {
	return {
		id: "T001",
		uniqueId: "T001-standard",
		name: "Test Card",
		rarity: "common",
		foiling: "standard",
		edition: "N",
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

interface CmProductFixture {
	idProduct: number;
	dateAdded: string;
	price: number;
}

/** A single-expansion, single-metacard catalog for one card name, built from
 * whichever Cardmarket products a test hands it (2 for a Marvel/standard
 * pair, 4 for a two-collector-number card like Mandible Claw). No sealed
 * products, so edition resolves to null and every printing is compared. */
function catalogWith(cmProducts: CmProductFixture[]): CardmarketCatalog {
	return {
		sourceUpdatedAt: "2026-01-01T00:00:00Z",
		metacardsByCard: new Map([["test card|", new Set([1])]]),
		productsByCardInSet: new Map([
			[
				"1|100",
				cmProducts.map((product) => ({
					idProduct: product.idProduct,
					name: "Test Card",
					idExpansion: 100,
					idMetacard: 1,
					dateAdded: product.dateAdded,
				})),
			],
		]),
		expansionsByMetacard: new Map([[1, [100]]]),
		sealedByExpansion: new Map(),
		priceByProduct: new Map(
			cmProducts.map((product) => [product.idProduct, product.price]),
		),
	};
}

describe("buildCardmarketSnapshot's price-based Marvel pairing", () => {
	it("pairs by price instead of trusting a dateAdded order that runs backwards", () => {
		// The real bug: The Hunted's "Arakni, Trap-Door" token print (added
		// to Cardmarket first) paired against a EUR 23.67 product, and its
		// Marvel (added nine months later) against EUR 0.34 — dateAdded
		// order exactly as a plainest-first assumption would predict, and
		// still backwards from what the card is actually worth. Cardmarket's
		// flat files carry no field naming a treatment, so price is the only
		// remaining signal — sorting by it should recover the correct pair
		// regardless of which product Cardmarket happened to add first.
		const catalog = catalogWith([
			{ idProduct: 501, dateAdded: "2025-01-22", price: 23.67 },
			{ idProduct: 502, dateAdded: "2025-10-14", price: 0.34 },
		]);
		const printings = [
			printing({ uniqueId: "standard", rarity: "common", foiling: "standard" }),
			printing({
				uniqueId: "marvel",
				rarity: "marvel",
				foiling: "cold",
				artVariations: ["FA"],
			}),
		];

		const { snapshot, coverage } = buildCardmarketSnapshot(
			"TST",
			printings,
			{},
			catalog,
		);

		expect(snapshot.cardPrices).toEqual({ standard: 0.34, marvel: 23.67 });
		expect(coverage.priced).toBe(2);
		expect(coverage.priceOrderMismatch).toBe(0);
	});

	it("still prices a normal, already-correctly-ordered Marvel/standard pair", () => {
		const catalog = catalogWith([
			{ idProduct: 501, dateAdded: "2025-01-01", price: 0.5 },
			{ idProduct: 502, dateAdded: "2025-06-01", price: 20 },
		]);
		const printings = [
			printing({ uniqueId: "standard", rarity: "common", foiling: "standard" }),
			printing({
				uniqueId: "marvel",
				rarity: "marvel",
				foiling: "cold",
				artVariations: ["FA"],
			}),
		];

		const { snapshot, coverage } = buildCardmarketSnapshot(
			"TST",
			printings,
			{},
			catalog,
		);

		expect(snapshot.cardPrices).toEqual({ standard: 0.5, marvel: 20 });
		expect(coverage.priced).toBe(2);
		expect(coverage.priceOrderMismatch).toBe(0);
	});

	it("keeps two collector numbers' prices from crossing into each other, Mandible Claw-style", () => {
		// Crucible of War's Mandible Claw prints twice (CRU004, CRU005),
		// each with a standard and a Rainbow Foil; Cardmarket files all four
		// under one card name/metacard. The real four products run 0.28,
		// 5.68, 0.16, 4.12 in dateAdded order — CRU004 normal, CRU004
		// Rainbow, CRU005 normal, CRU005 Rainbow. Sorting by price WITHIN
		// each dateAdded-clustered pair (not across the whole set of four)
		// must still land CRU005's cheap 0.16 on CRU005's own standard, not
		// on CRU004's — which a naive global price sort would get wrong,
		// since 0.16 is cheaper than CRU004's own Rainbow Foil (5.68).
		const catalog = catalogWith([
			{ idProduct: 601, dateAdded: "2025-01-01", price: 0.28 },
			{ idProduct: 602, dateAdded: "2025-01-02", price: 5.68 },
			{ idProduct: 603, dateAdded: "2025-01-03", price: 0.16 },
			{ idProduct: 604, dateAdded: "2025-01-04", price: 4.12 },
		]);
		const printings = [
			printing({
				id: "CRU004",
				uniqueId: "cru004-standard",
				foiling: "standard",
			}),
			printing({
				id: "CRU004",
				uniqueId: "cru004-rainbow",
				foiling: "rainbow",
			}),
			printing({
				id: "CRU005",
				uniqueId: "cru005-standard",
				foiling: "standard",
			}),
			printing({
				id: "CRU005",
				uniqueId: "cru005-rainbow",
				foiling: "rainbow",
			}),
		];

		const { snapshot, coverage } = buildCardmarketSnapshot(
			"CRU",
			printings,
			{},
			catalog,
		);

		expect(snapshot.cardPrices).toEqual({
			"cru004-standard": 0.28,
			"cru004-rainbow": 5.68,
			"cru005-standard": 0.16,
			"cru005-rainbow": 4.12,
		});
		expect(coverage.priced).toBe(4);
		expect(coverage.priceOrderMismatch).toBe(0);
	});
});
