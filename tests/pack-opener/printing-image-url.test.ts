import { describe, expect, it } from "bun:test";
import {
	type FabPrinting,
	printingImageUrl,
} from "../../src/shared/data/fab-printings";

function printing(overrides: Partial<FabPrinting>): FabPrinting {
	return {
		id: "SEA001",
		uniqueId: "test-unique-id",
		name: "Test Card",
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

/**
 * The scope gate from the execution plan, section 3.2: artSlug is only
 * ever used for Marvel printings. A great many non-Marvel printings also
 * have a differing artSlug (Unlimited-edition reprints, resized thumbnail
 * artifacts, and real Rainbow/Cold Foil artwork with the foil effect
 * already baked in, which would double up with this app's own foil
 * shader) — using it for those would be a regression, not a fix, so this
 * is tested explicitly rather than trusted to stay right by accident.
 */
describe("printingImageUrl", () => {
	it("uses the real artwork slug for a Marvel printing", () => {
		const url = printingImageUrl(
			printing({ id: "SEA001", rarity: "marvel", artSlug: "SEA001-MV" }),
		);
		expect(url).toBe("https://content.fabrary.net/cards/SEA001-MV.webp");
	});

	it("falls back to the bare id when a Marvel printing has no artSlug", () => {
		const url = printingImageUrl(
			printing({ id: "SEA001", rarity: "marvel", artSlug: null }),
		);
		expect(url).toBe("https://content.fabrary.net/cards/SEA001.webp");
	});

	it("uses the bare id for a non-Marvel printing even when artSlug differs", () => {
		// e.g. a real Rainbow Foil printing whose artSlug is "EVO013-RF" —
		// must never be used outside the Marvel case, see this function's
		// own doc comment.
		const url = printingImageUrl(
			printing({ id: "EVO013", rarity: "legendary", artSlug: "EVO013-RF" }),
		);
		expect(url).toBe("https://content.fabrary.net/cards/EVO013.webp");
	});

	it("uses the bare id for every other non-Marvel rarity", () => {
		for (const rarity of [
			"common",
			"rare",
			"majestic",
			"legendary",
			"basic",
			"token",
		] as const) {
			const url = printingImageUrl(
				printing({ id: "WTR050", rarity, artSlug: "WTR050-XY" }),
			);
			expect(url).toBe("https://content.fabrary.net/cards/WTR050.webp");
		}
	});
});
