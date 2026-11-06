import { describe, expect, it } from "bun:test";
import {
	resolveCard,
	resolveTreatment,
} from "@fabkit/apps/pack-opener/cards/card-resolver";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { FabPrinting } from "@fabkit/shared/data/fab-printings";
import { makeDrawn, makePrinting } from "./pack-data";

const drawn = (overrides: Partial<DrawnCard>) =>
	makeDrawn({ slot: "premium-foil", rarity: "legendary", ...overrides });

const printing = (overrides: Partial<FabPrinting>) =>
	makePrinting({ rarity: "legendary", ...overrides });

/**
 * The real printed card wins over the odds engine's own draw wherever the
 * draw would otherwise show a version that doesn't exist: never plain if the
 * printing was never plain, and never Cold Foil if it has no cold version.
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

	it("keeps the premium slot's Rainbow, which is a property of the slot", () => {
		expect(
			resolveTreatment(
				drawn({ treatment: "rainbow" }),
				printing({ foiling: "standard" }),
			),
		).toBe("rainbow");
	});

	it("never shows Cold Foil on a printing with no cold version", () => {
		expect(
			resolveTreatment(
				drawn({ treatment: "cold" }),
				printing({ foiling: "standard" }),
			),
		).toBe("standard");
		expect(
			resolveTreatment(
				drawn({ treatment: "cold" }),
				printing({ foiling: "cold" }),
			),
		).toBe("cold");
	});

	it("lets a Fabled's own printing decide, whatever the premium slot says", () => {
		// Everfest, Dynasty and Heavy Hitters print only a Cold Foil Fabled.
		expect(
			resolveTreatment(
				drawn({ rarity: "fabled", treatment: "rainbow" }),
				printing({ rarity: "fabled", foiling: "cold" }),
			),
		).toBe("cold");
	});
});

/** A set whose data is missing must still give the scene something to draw, and
 * must not pretend to know what the card is. */
describe("resolveCard's placeholder", () => {
	it("keeps the draw's rarity and treatment and carries no real card data", () => {
		const resolved = resolveCard(
			drawn({ rarity: "marvel", treatment: "cold" }),
		);
		expect(resolved).toMatchObject({
			name: null,
			rarity: "marvel",
			treatment: "cold",
			imageUrl: null,
			backImageUrl: null,
			tcgplayerProductId: null,
			printingId: null,
		});
	});

	it("is what a set with no loaded printings resolves to", () => {
		expect(resolveCard(drawn({}), "NOT_LOADED").name).toBeNull();
	});
});
