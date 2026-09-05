import type {
	DrawnCard,
	PackConfig,
	RarityWeight,
} from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
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
			let marvel = false;
			if (slot.kind === "premium-foil" && rng() < config.marvelChance) {
				rarity = "marvel";
				marvel = true;
			}
			cards.push({
				id: uuid(),
				slot: slot.kind,
				rarity,
				foil: Boolean(slot.alwaysFoil),
				marvel,
			});
		}
	}

	if (rng() < config.coldFoilChance) {
		const nonPremiumIndexes = cards
			.map((card, index) => ({ card, index }))
			.filter(({ card }) => card.slot !== "premium-foil")
			.map(({ index }) => index);
		if (nonPremiumIndexes.length > 0) {
			const pickedIndex =
				nonPremiumIndexes[Math.floor(rng() * nonPremiumIndexes.length)];
			cards[pickedIndex] = { ...cards[pickedIndex], foil: true };
		}
	}

	return cards;
}
