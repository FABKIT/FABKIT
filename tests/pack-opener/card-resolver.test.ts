import { describe, expect, it } from "bun:test";
import { resolveTreatment } from "../../src/apps/pack-opener/cards/card-resolver";
import type { DrawnCard } from "../../src/apps/pack-opener/pack/types";
import type { FabPrinting } from "../../src/shared/data/fab-printings";

function drawn(overrides: Partial<DrawnCard>): DrawnCard {
	return {
		id: "test-drawn",
		slot: "premium-foil",
		rarity: "legendary",
		treatment: "standard",
		expansionSlot: false,
		...overrides,
	};
}

function printing(overrides: Partial<FabPrinting>): FabPrinting {
	return {
		id: "TST001",
		uniqueId: "test-unique-id",
		name: "Test Card",
		rarity: "legendary",
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

/**
 * Louis's decision (see the execution plan): the real printed card wins
 * over the odds engine's own draw, but only in the direction of "this
 * printing was never plain, so don't show it as plain" — never the other
 * way around, since a pack-level upgrade (the cold-foil roll) is a
 * mechanic of the pack, not a property of any one card.
 */
describe("resolveTreatment", () => {
	it("adopts the printing's foiling when the draw was standard but the printing never was", () => {
		expect(
			resolveTreatment(
				drawn({ treatment: "standard" }),
				printing({ foiling: "rainbow" }),
			),
		).toBe("rainbow");
	});

	it("leaves a standard draw alone when the printing really is standard", () => {
		expect(
			resolveTreatment(
				drawn({ treatment: "standard" }),
				printing({ foiling: "standard" }),
			),
		).toBe("standard");
	});

	it("never overrides a non-standard draw, even if the printing disagrees", () => {
		// The cold-foil upgrade roll is a pack mechanic (see
		// generate-pack.ts's coldFoilChance) — it must win regardless of
		// what this specific printing happens to be.
		expect(
			resolveTreatment(
				drawn({ treatment: "cold" }),
				printing({ foiling: "rainbow" }),
			),
		).toBe("cold");
		expect(
			resolveTreatment(
				drawn({ treatment: "rainbow" }),
				printing({ foiling: "standard" }),
			),
		).toBe("rainbow");
	});
});
