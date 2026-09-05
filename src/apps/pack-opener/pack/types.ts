import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

export type PackSlotKind =
	| "common"
	| "guaranteed-rare-plus"
	| "premium-foil"
	| "basic-or-token";

export interface RarityWeight {
	rarity: CardRarity;
	weight: number;
}

export interface PackSlotSpec {
	kind: PackSlotKind;
	count: number;
	rarityTable: RarityWeight[];
	/** Every card drawn into this slot is foil, independent of coldFoilChance. */
	alwaysFoil?: boolean;
}

export interface PackConfig {
	/** Key used to look this config up per-set — see pack/odds.ts's getPackConfig. */
	id: string;
	cardsPerPack: number;
	slots: PackSlotSpec[];
	/** Chance, once per pack, that a random non-premium slot's card is also foil. */
	coldFoilChance: number;
	/** Chance, applied to the premium slot's draw, that its rarity is bumped to "marvel". */
	marvelChance: number;
}

export interface DrawnCard {
	id: string;
	slot: PackSlotKind;
	rarity: CardRarity;
	foil: boolean;
	marvel: boolean;
}
