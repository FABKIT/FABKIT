import type {
	DrawnCard,
	PackConfig,
	RarityWeight,
} from "@fabkit/apps/pack-opener/pack/types";
import type { FoilTreatment } from "@fabkit/shared/data/fab-printings";
import { v4 as uuid } from "uuid";

function weightedPick(table: RarityWeight[], rng: () => number): RarityWeight {
	const total = table.reduce((sum, entry) => sum + entry.weight, 0);
	let roll = rng() * total;
	for (const entry of table) {
		roll -= entry.weight;
		if (roll <= 0) return entry;
	}
	return table[table.length - 1];
}

/** Generates one booster pack's worth of drawn cards from a PackConfig.
 * Always returns exactly `config.cardsPerPack` cards. Pass a seeded rng
 * (see pack/rng.ts) for deterministic rarities and treatments in tests; each
 * card's id is a uuid regardless. */
export function generatePack(
	config: PackConfig,
	rng: () => number = Math.random,
): DrawnCard[] {
	const cards: DrawnCard[] = [];

	for (const slot of config.slots) {
		for (let i = 0; i < slot.count; i++) {
			const picked = weightedPick(slot.rarityTable, rng);
			let rarity = picked.rarity;
			let treatment: FoilTreatment = slot.fixedTreatment ?? "standard";
			if (slot.kind === "premium-foil") {
				// Fabled first, and exclusive: it is the rarer of the two, and
				// rolling it second would let a Marvel be overwritten by it (or
				// the reverse) depending on order. One premium card, one upgrade.
				if (rng() < config.fabledChance) {
					rarity = "fabled";
				} else if (rng() < config.marvelChance) {
					rarity = "marvel";
				}
			}
			// Marvel cards are Cold Foil, barring a handful of Rainbow ones in
			// High Seas — see pack/types.ts's DrawnCard comment. This has to
			// override fixedTreatment, not just the marvelChance branch above:
			// a set can carry "marvel" as an ordinary rarityTable entry (High
			// Seas, Mastery Pack Warrior) in a slot whose fixedTreatment is
			// "rainbow", and a Marvel that came out rainbow would be wrong in a
			// way no rate test can see.
			if (rarity === "marvel") treatment = "cold";
			cards.push({
				id: uuid(),
				slot: slot.kind,
				rarity,
				treatment,
				expansionSlot: Boolean(picked.expansionSlot),
				requiresType: picked.requiresType,
				classRestricted: picked.classRestricted,
			});
		}
	}

	// Marks the upgrade without choosing the card: this module doesn't know the
	// set's printings. cards/card-resolver.ts's selectPrintingPool turns it into
	// a real cold printing, redrawing when the slot's rarity has none.
	if (config.coldFoilReplaces && rng() < config.coldFoilChance) {
		const eligibleIndexes = cards
			.map((card, index) => ({ card, index }))
			.filter(({ card }) => card.slot === config.coldFoilReplaces)
			.map(({ index }) => index);
		if (eligibleIndexes.length > 0) {
			const pickedIndex =
				eligibleIndexes[Math.floor(rng() * eligibleIndexes.length)];
			cards[pickedIndex] = { ...cards[pickedIndex], treatment: "cold" };
		}
	}

	return cards;
}
