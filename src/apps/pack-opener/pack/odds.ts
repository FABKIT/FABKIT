import {
	DEFAULT_COLD_FOIL_CHANCE,
	DEFAULT_MARVEL_CHANCE,
} from "@fabkit/apps/pack-opener/pack/rates";
import { REAL_SET_PACK_CONFIGS } from "@fabkit/apps/pack-opener/pack/set-configs";
import type {
	PackConfig,
	PackSlotSpec,
} from "@fabkit/apps/pack-opener/pack/types";

export { DEFAULT_COLD_FOIL_CHANCE, DEFAULT_MARVEL_CHANCE };

export const CARDS_PER_PACK = 16;
export const COMMON_SLOT_COUNT = 12;
export const RARE_SLOT_COUNT = 1;
export const PREMIUM_SLOT_COUNT = 1;
export const BASIC_SLOT_COUNT = 2;

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
	// Real sets' guaranteed foil slot is Rainbow Foil (see the execution
	// plan's per-set pull rate research) — matched here for the mock config.
	fixedTreatment: "rainbow",
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
	coldFoilReplaces: "basic-or-token",
	marvelChance: DEFAULT_MARVEL_CHANCE,
};

export const PackConfigsBySet: Record<string, PackConfig> = {
	[DEFAULT_PACK_CONFIG.id]: DEFAULT_PACK_CONFIG,
	...REAL_SET_PACK_CONFIGS,
};

export function getPackConfig(setCode?: string): PackConfig {
	if (setCode && PackConfigsBySet[setCode]) return PackConfigsBySet[setCode];
	return DEFAULT_PACK_CONFIG;
}
