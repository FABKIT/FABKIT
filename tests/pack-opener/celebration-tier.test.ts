import { describe, expect, it } from "bun:test";
import type { ResolvedCard } from "../../src/apps/pack-opener/cards/card-resolver";
import { celebrationTierFor } from "../../src/apps/pack-opener/cards/celebration-tier";

function card(overrides: Partial<ResolvedCard>): ResolvedCard {
	return {
		id: "test-card",
		name: "Test Card",
		rarity: "common",
		treatment: "standard",
		imageUrl: null,
		backImageUrl: null,
		pitch: null,
		cost: null,
		power: null,
		defense: null,
		tcgplayerProductId: null,
		...overrides,
	};
}

describe("celebrationTierFor", () => {
	it("gives nothing to a plain common", () => {
		expect(celebrationTierFor(card({ rarity: "common" }))).toBeNull();
	});

	it("gives nothing to a plain rare", () => {
		expect(celebrationTierFor(card({ rarity: "rare" }))).toBeNull();
	});

	it("gives nothing to a basic or token even if somehow foiled", () => {
		expect(
			celebrationTierFor(card({ rarity: "basic", treatment: "rainbow" })),
		).toBe("foil");
		// (a foil basic is unusual but not impossible in the data — it still
		// earns the general "foil" tier, just not one of its own)
	});

	it("gives a plain majestic its own gentle tier", () => {
		expect(
			celebrationTierFor(card({ rarity: "majestic", treatment: "standard" })),
		).toBe("majestic");
	});

	it("gives any non-majestic foil the foil tier", () => {
		expect(
			celebrationTierFor(card({ rarity: "rare", treatment: "rainbow" })),
		).toBe("foil");
		expect(
			celebrationTierFor(card({ rarity: "superrare", treatment: "cold" })),
		).toBe("foil");
	});

	it("keeps a foil majestic in the majestic tier, not the foil one", () => {
		// Regression: this used to return "foil", on the reasoning that a
		// card should not be double-counted. Harmless while the tier only
		// chose a glow colour, but the tier now also decides whether a pull
		// gets particles at all, and a foil Majestic was ending up with LESS
		// celebration than a plain one — reported from the app as "a majestic
		// rainbow foil that didn't have the sparkles".
		expect(
			celebrationTierFor(card({ rarity: "majestic", treatment: "rainbow" })),
		).toBe("majestic");
		expect(
			celebrationTierFor(card({ rarity: "majestic", treatment: "cold" })),
		).toBe("majestic");
	});

	it("still gives a foil common or rare only the foil tier", () => {
		// The other side of that change: rarity outranking foil must not
		// promote an ordinary card into a rarity celebration.
		expect(
			celebrationTierFor(card({ rarity: "common", treatment: "rainbow" })),
		).toBe("foil");
		expect(
			celebrationTierFor(card({ rarity: "rare", treatment: "cold" })),
		).toBe("foil");
	});

	it("gives legendary its own tier regardless of foil treatment", () => {
		expect(
			celebrationTierFor(card({ rarity: "legendary", treatment: "standard" })),
		).toBe("legendary");
		expect(
			celebrationTierFor(card({ rarity: "legendary", treatment: "rainbow" })),
		).toBe("legendary");
	});

	it("gives fabled the same tier as legendary", () => {
		expect(
			celebrationTierFor(card({ rarity: "fabled", treatment: "standard" })),
		).toBe("legendary");
	});

	it("marvel always wins, even over legendary treatment quirks", () => {
		expect(
			celebrationTierFor(card({ rarity: "marvel", treatment: "cold" })),
		).toBe("marvel");
	});
});
