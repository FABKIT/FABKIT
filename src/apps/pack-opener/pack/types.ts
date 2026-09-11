import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type { FoilTreatment } from "@fabkit/shared/data/fab-printings";

export type PackSlotKind =
	| "common"
	| "guaranteed-rare-plus"
	| "premium-foil"
	| "basic-or-token"
	| "rare"
	| "rare-or-majestic"
	| "rare-or-super-rare-plus"
	| "token"
	| "token-or-wildcard"
	| "basic"
	| "basic-or-wildcard"
	| "generic-common"
	| "class-common"
	| "equipment"
	/** One promo card, in a product whose every card is a promo — the GEM
	 * Packs handed out at Armory events. Those have no rarity structure at
	 * all (every printing is Promo), so what distinguishes their two slots
	 * is FOILING, not rarity: a regular print and a premium foil. */
	| "promo";

export interface RarityWeight {
	rarity: CardRarity;
	weight: number;
	/** This entry draws from `rarity`'s *expansion-slot* printings (see
	 * shared/data/fab-printings.ts's `expansionSlot` flag) rather than its
	 * ordinary pool — real sets publish wildcard slots like "Token /
	 * Expansion Slot" or "Basic / Expansion Slot / Legendary / Marvel"
	 * where one of the possible outcomes is specifically an expansion-slot
	 * printing. LSS doesn't publish which rarity an expansion-slot pull
	 * tends to land on, so configs that use this pick one representative
	 * rarity for it rather than modelling the full spread — see each
	 * config's own comment in odds.ts. */
	expansionSlot?: boolean;
	/** This entry only matches printings whose card types (see
	 * shared/data/fab-printings.ts's `types`/`hasType`) include this value
	 * (case-insensitive) — e.g. "Equipment", for the handful of early sets
	 * that name a slot by card type rather than by rarity alone. */
	requiresType?: string;
	/** This entry only matches printings that ARE class-restricted (Brute,
	 * Guardian, ... — see fab-printings.ts's `isClassCard`) when true, or
	 * that are generic (no class) when false. Omit when a slot doesn't
	 * care either way. Welcome to Rathe and Arcane Rising split their
	 * common slot into a fixed "4 Generic Commons" + "7 Class Commons"
	 * rather than a single undifferentiated common slot — see
	 * pack/set-configs.ts. */
	classRestricted?: boolean;
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
	/** Chance, once per pack, that one eligible card is upgraded to "cold" —
	 * see coldFoilReplaces for which slot is eligible. 0 (or coldFoilReplaces
	 * left unset) means this set publishes no such upgrade at all. */
	coldFoilChance: number;
	/** Which slot's card the coldFoilChance roll can upgrade to "cold" —
	 * real sets differ on this (a token, a Basic, a Rare, or in Everfest's
	 * case, the premium slot itself changes from Rainbow to Cold). Applies
	 * regardless of that slot's current treatment, so it also covers the
	 * Everfest case where the target already has a fixedTreatment. */
	coldFoilReplaces?: PackSlotKind;
	/** Chance, applied to the premium slot's draw, that its rarity is bumped
	 * to "fabled" — a set's single rarest card. No set publishes a rate for
	 * it (every Collectors Centre page prints "1 per ??? packs"), so this is
	 * derived from the set's Marvel rate; see pack/published-rates.ts's
	 * FABLED_SHARE_OF_MARVEL. 0 for the two sets whose boosters contain no
	 * Fabled printing at all.
	 *
	 * Rolled before marvelChance and winning outright when both hit, so the
	 * two rolls can never both land on one card. Unlike Marvel, a Fabled
	 * draw keeps the premium slot's own treatment: real Fabled printings are
	 * Rainbow Foil, Cold Foil, or both depending on the set, so the printing
	 * decides rather than the engine (see cards/card-resolver.ts's
	 * resolveTreatment, which already does this for Legendary). */
	fabledChance: number;
	/** Chance, applied to the premium slot's draw, that its rarity is bumped
	 * to "marvel". Only used by sets that don't publish Marvel as its own
	 * slot entry — most modern sets fold Marvel into a wildcard slot's own
	 * rarityTable instead (see odds.ts), in which case this is 0. */
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
	/** True when this draw should resolve from `rarity`'s expansion-slot
	 * pool rather than its ordinary pool — see RarityWeight.expansionSlot. */
	expansionSlot: boolean;
	/** See RarityWeight.requiresType. */
	requiresType?: string;
	/** See RarityWeight.classRestricted. */
	classRestricted?: boolean;
}
