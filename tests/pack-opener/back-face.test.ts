import { describe, expect, it } from "bun:test";
import type { FabPrinting } from "@fabkit/shared/data/fab-printings";
import { printingBackImageUrl } from "@fabkit/shared/data/fab-printings";

function printing(overrides: Partial<FabPrinting> = {}): FabPrinting {
	return {
		id: "DTD007",
		uniqueId: "uid",
		name: "Aegis, Archangel of Protection",
		rarity: "majestic",
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

/** The other face of a double-faced card. The slug itself is resolved at
 * build time (scripts/build-pack-data.ts's backSlugFor, which documents why
 * it cannot be derived from the collector id at runtime); this covers the
 * URL shape and, most importantly, that a single-faced card offers nothing
 * to flip to. */
describe("printingBackImageUrl", () => {
	it("is null for a card with only one face", () => {
		expect(printingBackImageUrl(printing())).toBeNull();
	});

	it("builds the other face's URL from the resolved slug", () => {
		expect(printingBackImageUrl(printing({ backSlug: "DTD007_BACK" }))).toBe(
			"https://content.fabrary.net/cards/DTD007_BACK.webp",
		);
	});

	it("uses the same host and path as the front", () => {
		// The two must stay on one URL shape; a second host or path here
		// would be a thing to keep in step by hand.
		const back = printingBackImageUrl(printing({ backSlug: "MST095_BACK" }));
		expect(back?.startsWith("https://content.fabrary.net/cards/")).toBe(true);
		expect(back?.endsWith(".webp")).toBe(true);
	});
});
