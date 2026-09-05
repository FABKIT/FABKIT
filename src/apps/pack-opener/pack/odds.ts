import type {
	PackConfig,
	PackSlotSpec,
} from "@fabkit/apps/pack-opener/pack/types";

export const CARDS_PER_PACK = 16;
export const COMMON_SLOT_COUNT = 12;
export const RARE_SLOT_COUNT = 1;
export const PREMIUM_SLOT_COUNT = 1;
export const BASIC_SLOT_COUNT = 2;

/**
 * LSS has never published an official per-set cold foil rate. ~1/22 packs is a
 * widely cited community estimate across recent non-Draft retail sets
 * (Part the Mistveil / The Hunted / Dusk till Dawn / Heavy Hitters) —
 * treat as an approximation, not a sourced constant.
 */
export const DEFAULT_COLD_FOIL_CHANCE = 1 / 22;

/**
 * Marvel is an unofficial, unpublished ultra-rare alternate-art treatment.
 * No documented pull rate exists — community tracking suggests it varies
 * wildly per card/set (roughly 1:1000 up to documented outliers around
 * 1:10,000 for chase cards). 1/2000 is a rough placeholder, intentionally
 * configurable per set rather than a real published rate.
 */
export const DEFAULT_MARVEL_CHANCE = 1 / 2000;

const commonSlot: PackSlotSpec = {
	kind: "common",
	count: COMMON_SLOT_COUNT,
	rarityTable: [{ rarity: "common", weight: 1 }],
};

const guaranteedRareSlot: PackSlotSpec = {
	kind: "guaranteed-rare-plus",
	count: RARE_SLOT_COUNT,
	rarityTable: [
		{ rarity: "rare", weight: 85 },
		{ rarity: "superrare", weight: 12 },
		{ rarity: "majestic", weight: 3 },
	],
};

const premiumFoilSlot: PackSlotSpec = {
	kind: "premium-foil",
	count: PREMIUM_SLOT_COUNT,
	alwaysFoil: true,
	rarityTable: [
		{ rarity: "rare", weight: 70 },
		{ rarity: "superrare", weight: 22 },
		{ rarity: "majestic", weight: 7 },
		{ rarity: "legendary", weight: 1 },
	],
};

const basicOrTokenSlot: PackSlotSpec = {
	kind: "basic-or-token",
	count: BASIC_SLOT_COUNT,
	rarityTable: [
		{ rarity: "basic", weight: 3 },
		{ rarity: "token", weight: 1 },
	],
};

export const DEFAULT_PACK_CONFIG: PackConfig = {
	id: "default-mock-set",
	cardsPerPack: CARDS_PER_PACK,
	slots: [commonSlot, guaranteedRareSlot, premiumFoilSlot, basicOrTokenSlot],
	coldFoilChance: DEFAULT_COLD_FOIL_CHANCE,
	marvelChance: DEFAULT_MARVEL_CHANCE,
};

export const PackConfigsBySet: Record<string, PackConfig> = {
	[DEFAULT_PACK_CONFIG.id]: DEFAULT_PACK_CONFIG,
};

export function getPackConfig(setCode?: string): PackConfig {
	if (setCode && PackConfigsBySet[setCode]) return PackConfigsBySet[setCode];
	return DEFAULT_PACK_CONFIG;
}
