import { REAL_SET_PACK_CONFIGS } from "@fabkit/apps/pack-opener/pack/set-configs";
import type {
	PackConfig,
	PackSlotSpec,
} from "@fabkit/apps/pack-opener/pack/types";

const CARDS_PER_PACK = 16;
const COMMON_SLOT_COUNT = 12;
const RARE_SLOT_COUNT = 1;
const PREMIUM_SLOT_COUNT = 1;
const BASIC_SLOT_COUNT = 2;

/** Placeholder for the mock config only, close to the 1 per 24 that most real
 * sets publish. Real sets state their own rate in pack/published-rates.ts. */
const MOCK_COLD_FOIL_CHANCE = 1 / 22;

/** Placeholder for the mock config only. Real sets state their own rate, or an
 * openly flagged estimate, in pack/published-rates.ts. */
const MOCK_MARVEL_CHANCE = 1 / 2000;

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
	// Matches real sets, whose guaranteed foil slot is Rainbow Foil.
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
	coldFoilChance: MOCK_COLD_FOIL_CHANCE,
	coldFoilReplaces: "basic-or-token",
	marvelChance: MOCK_MARVEL_CHANCE,
	// The mock config's pool is drawn, not real, and has no Fabled card
	// to resolve to.
	fabledChance: 0,
};

const PACK_CONFIGS_BY_SET: Record<string, PackConfig> = {
	[DEFAULT_PACK_CONFIG.id]: DEFAULT_PACK_CONFIG,
	...REAL_SET_PACK_CONFIGS,
};

export function getPackConfig(setCode?: string): PackConfig {
	if (setCode && PACK_CONFIGS_BY_SET[setCode]) {
		return PACK_CONFIGS_BY_SET[setCode];
	}
	return DEFAULT_PACK_CONFIG;
}
