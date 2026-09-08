import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type { FoilTreatment } from "@fabkit/shared/data/fab-printings";

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
	/** Every card drawn into this slot has this treatment, independent of
	 * the pack-level coldFoilChance roll — e.g. the guaranteed foil slot,
	 * which real sets print as Rainbow Foil. Omit for a slot whose cards
	 * start "standard" and are only ever changed by that pack-level roll. */
	fixedTreatment?: FoilTreatment;
}

export interface PackConfig {
	/** Key used to look this config up per-set — see pack/odds.ts's getPackConfig. */
	id: string;
	cardsPerPack: number;
	slots: PackSlotSpec[];
	/** Chance, once per pack, that one card without a fixedTreatment is
	 * upgraded from "standard" to "cold". */
	coldFoilChance: number;
	/** Chance, applied to the premium slot's draw, that its rarity is bumped to "marvel". */
	marvelChance: number;
}

export interface DrawnCard {
	id: string;
	slot: PackSlotKind;
	rarity: CardRarity;
	/** A printing's foil treatment — see shared/data/fab-printings.ts. Real
	 * Marvel cards are exclusively printed Cold Foil, so a "marvel" rarity
	 * draw always carries treatment "cold"; rarity is what actually marks a
	 * card as Marvel, not the treatment itself. */
	treatment: FoilTreatment;
}
