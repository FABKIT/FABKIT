import { describe, expect, it } from "bun:test";
import { generatePack } from "@fabkit/apps/pack-opener/pack/generate-pack";
import { DEFAULT_PACK_CONFIG } from "@fabkit/apps/pack-opener/pack/odds";
import { orderForReveal } from "@fabkit/apps/pack-opener/pack/reveal-order";
import { REAL_SET_PACK_CONFIGS } from "@fabkit/apps/pack-opener/pack/set-configs";
import type {
	DrawnCard,
	PackSlotKind,
} from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import { mulberry32 } from "@fabkit/shared/random";

let nextId = 0;
function drawn(slot: PackSlotKind, rarity: CardRarity): DrawnCard {
	nextId += 1;
	return {
		id: `card-${nextId}`,
		slot,
		rarity,
		treatment: slot === "premium-foil" ? "rainbow" : "standard",
		expansionSlot: false,
	};
}

function describeOrder(cards: DrawnCard[]): string[] {
	return orderForReveal(cards).map((card) => `${card.slot}:${card.rarity}`);
}

describe("orderForReveal", () => {
	it("puts commons first, then rares and up, then tokens and the expansion slot", () => {
		expect(
			describeOrder([
				drawn("token", "token"),
				drawn("rare-or-majestic", "majestic"),
				drawn("basic-or-wildcard", "basic"),
				drawn("rare", "rare"),
				drawn("common", "common"),
				drawn("common", "common"),
			]),
		).toEqual([
			"common:common",
			"common:common",
			"rare:rare",
			"rare-or-majestic:majestic",
			"token:token",
			"basic-or-wildcard:basic",
		]);
	});

	it("makes a common foil the last common", () => {
		expect(
			describeOrder([
				drawn("premium-foil", "common"),
				drawn("common", "common"),
				drawn("rare", "rare"),
				drawn("token", "token"),
			]),
		).toEqual([
			"common:common",
			"premium-foil:common",
			"rare:rare",
			"token:token",
		]);
	});

	it("makes a rare-or-better foil the last of the rares", () => {
		for (const rarity of [
			"rare",
			"superrare",
			"majestic",
			"legendary",
		] as const) {
			expect(
				describeOrder([
					drawn("premium-foil", rarity),
					drawn("common", "common"),
					drawn("rare-or-majestic", "majestic"),
					drawn("rare", "rare"),
					drawn("token", "token"),
				]),
			).toEqual([
				"common:common",
				"rare:rare",
				"rare-or-majestic:majestic",
				`premium-foil:${rarity}`,
				"token:token",
			]);
		}
	});

	it("keeps a Legendary where its slot sits in the pack", () => {
		expect(
			describeOrder([
				drawn("basic-or-wildcard", "legendary"),
				drawn("basic", "basic"),
				drawn("rare-or-majestic", "legendary"),
				drawn("rare", "rare"),
				drawn("common", "common"),
			]),
		).toEqual([
			"common:common",
			"rare:rare",
			"rare-or-majestic:legendary",
			"basic:basic",
			"basic-or-wildcard:legendary",
		]);
	});

	it("places an equipment slot by what it holds", () => {
		expect(
			describeOrder([
				drawn("equipment", "legendary"),
				drawn("class-common", "common"),
				drawn("equipment", "common"),
				drawn("rare", "rare"),
			]),
		).toEqual([
			"class-common:common",
			"equipment:common",
			"rare:rare",
			"equipment:legendary",
		]);
	});

	it("sorts by the rarity it is told the player will see", () => {
		const upgraded = drawn("token", "token");
		const ordered = orderForReveal(
			[upgraded, drawn("token", "token"), drawn("common", "common")],
			(card) => ({
				rarity: card === upgraded ? "majestic" : card.rarity,
				isToken: false,
			}),
		);
		expect(ordered[ordered.length - 1]).toBe(upgraded);
	});

	it("moves a token printed at Common out of the commons to the back", () => {
		const commonToken = drawn("common", "common");
		const foilToken = drawn("premium-foil", "common");
		const ordered = orderForReveal(
			[
				commonToken,
				foilToken,
				drawn("common", "common"),
				drawn("rare-or-majestic", "majestic"),
				drawn("rare", "rare"),
			],
			(card) => ({
				rarity: card.rarity,
				isToken: card === commonToken || card === foilToken,
			}),
		);
		expect(ordered.map((card) => `${card.slot}:${card.rarity}`)).toEqual([
			"common:common",
			"rare:rare",
			"rare-or-majestic:majestic",
			"common:common",
			"premium-foil:common",
		]);
		expect(ordered.slice(-2)).toEqual([commonToken, foilToken]);
	});

	it("never mixes the three stretches, in any real set", () => {
		const stretch = (card: DrawnCard): number => {
			if (card.slot.startsWith("token") || card.slot.startsWith("basic")) {
				return 2;
			}
			if (["common", "promo"].includes(card.rarity)) return 0;
			if (["token", "basic"].includes(card.rarity)) return 2;
			return 1;
		};
		const rng = mulberry32(7);
		for (const config of [
			DEFAULT_PACK_CONFIG,
			...Object.values(REAL_SET_PACK_CONFIGS),
		]) {
			for (let i = 0; i < 200; i++) {
				const stretches = orderForReveal(generatePack(config, rng)).map(
					stretch,
				);
				expect(stretches).toEqual([...stretches].sort());
			}
		}
	});

	it("preserves the exact multiset of card ids", () => {
		const rng = mulberry32(8);
		const pack = generatePack(DEFAULT_PACK_CONFIG, rng);
		const ordered = orderForReveal(pack);
		expect(ordered.length).toBe(pack.length);
		expect(new Set(ordered.map((c) => c.id))).toEqual(
			new Set(pack.map((c) => c.id)),
		);
	});
});
