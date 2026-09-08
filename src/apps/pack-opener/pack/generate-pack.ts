import type {
	DrawnCard,
	PackConfig,
	RarityWeight,
} from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type { FoilTreatment } from "@fabkit/shared/data/fab-printings";
import { v4 as uuid } from "uuid";

function weightedPick(table: RarityWeight[], rng: () => number): CardRarity {
	const total = table.reduce((sum, entry) => sum + entry.weight, 0);
	let roll = rng() * total;
	for (const entry of table) {
		roll -= entry.weight;
		if (roll <= 0) return entry.rarity;
	}
	return table[table.length - 1].rarity;
}

/** Generates one booster pack's worth of drawn cards from a PackConfig.
 * Always returns exactly `config.cardsPerPack` cards. Pass a seeded rng
 * (see pack/rng.ts) for deterministic output in tests. */
export function generatePack(
	config: PackConfig,
	rng: () => number = Math.random,
): DrawnCard[] {
	const cards: DrawnCard[] = [];

	for (const slot of config.slots) {
		for (let i = 0; i < slot.count; i++) {
			let rarity = weightedPick(slot.rarityTable, rng);
			let treatment: FoilTreatment = slot.fixedTreatment ?? "standard";
			if (slot.kind === "premium-foil" && rng() < config.marvelChance) {
				rarity = "marvel";
				// Real Marvel cards are exclusively printed Cold Foil — see
				// pack/types.ts's DrawnCard comment.
				treatment = "cold";
			}
			cards.push({ id: uuid(), slot: slot.kind, rarity, treatment });
		}
	}

	if (rng() < config.coldFoilChance) {
		const eligibleIndexes = cards
			.map((card, index) => ({ card, index }))
			.filter(({ card }) => card.treatment === "standard")
			.map(({ index }) => index);
		if (eligibleIndexes.length > 0) {
			const pickedIndex =
				eligibleIndexes[Math.floor(rng() * eligibleIndexes.length)];
			cards[pickedIndex] = { ...cards[pickedIndex], treatment: "cold" };
		}
	}

	return cards;
}
