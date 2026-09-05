import { hashToIndex } from "@fabkit/apps/pack-opener/cards/deterministic-hash";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

export type MockPitch = "red" | "yellow" | "blue" | null;

export interface MockCard {
	id: string;
	name: string;
	rarity: CardRarity;
	foil: boolean;
	marvel: boolean;
	/** null = generic (gold-trim) frame, matching real non-pitch cards. */
	pitch: MockPitch;
	cost: number;
	power: number;
	defense: number;
}

const FLAVOR_NAMES_BY_RARITY: Record<CardRarity, string[]> = {
	basic: ["Cracked Bauble", "Blazing Aether", "Tempered Steel"],
	token: ["Young Recruit", "Spark Elemental", "Training Blade"],
	common: ["Rising Knee", "Sink Below", "Wary Slice", "Snapdragon Scout"],
	rare: ["Ember's Eruption", "Command and Conquer", "Rock, Paper, Scissors"],
	superrare: ["Enlightened Strike", "Fyendal's Spring Tunic", "Art of War"],
	majestic: ["Storm's Fury", "Winter's Grasp", "Reforged Legacy"],
	legendary: ["Prism", "Bloodrush Bombardment", "Kaleidoscope"],
	fabled: ["Heart of Fyendal", "Dawnblade", "Cindershot"],
	promo: ["Promo Exclusive", "Convention Special", "Signed Edition"],
	marvel: ["Marvel Treatment", "Chase Pull", "Rainbow Foil Marvel"],
};

/** Tokens have no pitch in real FAB — every other rarity gets one, cycled
 * deterministically off the card id for visual variety across a pack. */
const PITCHES: Exclude<MockPitch, null>[] = ["red", "yellow", "blue"];

export function resolveMockCard(drawn: DrawnCard): MockCard {
	const names = FLAVOR_NAMES_BY_RARITY[drawn.rarity];
	const name = names[hashToIndex(drawn.id, names.length)];
	const pitch =
		drawn.rarity === "token" ? null : PITCHES[hashToIndex(`${drawn.id}p`, 3)];
	return {
		id: drawn.id,
		name,
		rarity: drawn.rarity,
		foil: drawn.foil,
		marvel: drawn.marvel,
		pitch,
		cost: hashToIndex(`${drawn.id}c`, 4),
		power: hashToIndex(`${drawn.id}pw`, 8) + 1,
		defense: hashToIndex(`${drawn.id}d`, 6) + 1,
	};
}
