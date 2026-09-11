/**
 * EVERY NUMBER THAT DECIDES WHAT COMES OUT OF A PACK.
 *
 * This file is meant to be edited by hand. Change a number here and the
 * app follows: `pack/set-configs.ts` turns these rates into the weights
 * the pack generator actually draws with, so there is no second place to
 * keep in sync.
 *
 * ---------------------------------------------------------------------
 * HOW TO READ A RATE
 *
 * Almost everything here is "how many of this rarity come out of one
 * pack, on average".
 *
 *   rare: 1.83          means 1.83 Rares per pack
 *   majestic: 1 / 4     means one Majestic every 4 packs
 *   marvel: 1 / 60      means one Marvel every 60 packs
 *
 * Write `1 / 4`, not `0.25`. Both work, but the first is what the source
 * page says, so it stays checkable.
 *
 * ---------------------------------------------------------------------
 * WHERE THESE COME FROM
 *
 * Each set's rates are transcribed from its Collectors Centre page on
 * fabtcg.com, recorded verbatim in `docs/pull-rate-verification.md`. Each
 * entry below is tagged so you can tell sourced numbers from the rest:
 *
 *   PUBLISHED  printed on the set's own page
 *   OBSERVED   counted from real product, not published by LSS
 *   ESTIMATED  no number exists anywhere; a documented guess
 *   POPULATION how many cards the set prints at a rarity, used only where
 *              LSS states which rarities a slot can hold but never how
 *              often each one comes up
 *
 * ---------------------------------------------------------------------
 * WHAT HAPPENS IF YOU CHANGE ONE
 *
 * `tests/pack-opener/calibration.test.ts` opens 200,000 packs per set and
 * checks each rarity against the published figure, within 20%. If you
 * raise a rate past what that test expects, it fails and tells you which
 * set and rarity. That is working as intended: it means the app and this
 * file disagree, and one of them needs updating.
 *
 * Rates within one slot cannot add up to more than 1, because a slot
 * holds one card. Push them past that and the app throws at startup
 * naming the slot, rather than dealing a quietly wrong distribution.
 */

/** Chance, per pack, of a Marvel in a set that prints real Marvels but
 * has no published rate for them. ESTIMATED: eight sets do publish one
 * (1 per 60, 96, 96, 100, 100, 110, 192 and 390 packs) and this is their
 * median. */
export const ESTIMATED_MARVEL_CHANCE = 1 / 100;

/** Fabled's chance, per pack, as a share of the same set's Marvel chance.
 * ESTIMATED, and necessarily so: no set publishes a Fabled rate at all,
 * every page prints "1 per ??? packs". Half a Marvel's chance keeps a
 * set's single Fabled card the rarest thing it can deal while still
 * making it reachable, which is the point. A set with no Marvel rate of
 * its own gets half of ESTIMATED_MARVEL_CHANCE. */
export const FABLED_SHARE_OF_MARVEL = 0.5;

/** A set's Fabled chance per pack, from its own Marvel chance. Sets that
 * print no Marvel at all (the five oldest) fall back to the Marvel
 * estimate, so their Fabled still lands at one per 200 packs rather than
 * at zero. The two sets whose boosters contain no Fabled printing pass 0
 * explicitly instead of calling this. */
export function fabledChanceFor(marvelChance: number): number {
	const basis = marvelChance > 0 ? marvelChance : ESTIMATED_MARVEL_CHANCE;
	return basis * FABLED_SHARE_OF_MARVEL;
}

/** How much of a set's Majestic rate is expansion-slot content, where the
 * set prints such cards and LSS publishes no separate rate for them.
 * Expansion-slot printings are Majestic rarity, so they come OUT of the
 * published Majestic rate rather than on top of it; only the split is
 * ours. Sets whose page DOES publish an expansion rate (Super Slam,
 * Omens) use that instead and ignore this. */
export const EXPANSION_SHARE_OF_MAJESTIC = 0.2;

/** The standard published cold-foil rate: one per display, and every set
 * here confirms a display is 24 packs. Sets that publish a different one
 * (Everfest 1 per 16, Compendium of Rathe 1 per 8) state it themselves. */
export const COLD_FOIL_PER_DISPLAY = 1 / 24;

/** The base and Premium Foil rates that Heavy Hitters, Part the Mistveil,
 * Rosetta and The Hunted all publish identically. Only Token and Marvel
 * differ between those four, and those live per-set below. All PUBLISHED. */
export const HVY_FAMILY_RATES = {
	rare: 1.83,
	majestic: 1 / 4,
	premiumLegendary: 1 / 96,
	premiumMajestic: 1 / 18,
	premiumRare: 5 / 24,
	coldFoil: COLD_FOIL_PER_DISPLAY,
} as const;

export const PUBLISHED_RATES = {
	// -----------------------------------------------------------------
	// Welcome to Rathe. PUBLISHED: Legendary 1 per 96, Majestic 1 per 12,
	// Super Rare 1 per 6, Rare 1.75, Common 12, Token 1. Legendary sits
	// in this set's Equipment slot; everything else in its two
	// rare-or-higher slots, of which the first is a guaranteed Rare.
	WTR: {
		superRare: 1 / 6,
		majestic: 1 / 12,
		equipmentLegendary: 1 / 96,
		coldFoil: 1 / 24,
	},
	// Arcane Rising. PUBLISHED: identical rates to Welcome to Rathe.
	ARC: {
		superRare: 1 / 6,
		majestic: 1 / 12,
		equipmentLegendary: 1 / 96,
		coldFoil: 1 / 24,
	},
	// Crucible of War. PUBLISHED: Legendary 1 per 240, Majestic 1 per 4,
	// Rare 1.75, Common 7. Legendary rides in the rare-or-higher slot;
	// this set has no Equipment slot to put it in.
	CRU: {
		majestic: 1 / 4,
		legendary: 1 / 240,
		coldFoil: 1 / 22,
	},
	// Monarch. PUBLISHED: Legendary 1 per 96, Majestic 1 per 4, Rare
	// 1.75, Common 12, Token 1.
	MON: {
		majestic: 1 / 4,
		equipmentLegendary: 1 / 96,
		coldFoil: 1 / 22,
	},
	// Tales of Aria. PUBLISHED: Legendary 1 per 88, Majestic 1 per 4,
	// Rare 1.75, Common 12, Token 1. Legendary rides in the premium slot.
	ELE: {
		majestic: 1 / 4,
		premiumLegendary: 1 / 88,
		coldFoil: 1 / 20,
	},

	// -----------------------------------------------------------------
	// Everfest. PUBLISHED: Legendary 1 per 160, Majestic 1 per 4, Rare
	// 1.65, Common 7, Cold Foil 1 per 16. No Token, Basic or Marvel
	// printings exist in this set at all.
	EVR: {
		rare: 1.65,
		majestic: 1 / 4,
		legendary: 1 / 160,
		coldFoil: 1 / 16,
	},
	// History Pack 1. PUBLISHED: Legendary 1 per 82, Majestic 1 per 3.15,
	// Rare 1.65, Common 7. Its Fabled and Marvel cards are Black Label
	// product only and cannot come out of a booster, which is why this is
	// the one set with no marvel rate rather than an estimated one.
	"1HP": {
		rare: 1.65,
		majestic: 1 / 3.15,
		legendary: 1 / 82,
		// This set's page lists no Cold Foil at all, and its Marvels are
		// Black Label only. Both are zero on purpose, not by omission.
		coldFoil: 0,
		marvel: 0,
	},
	// Uprising. PUBLISHED: Legendary 1 per 80 (Rainbow Foil), Majestic
	// 1 per 4, Rare 1.75, Common 11, Token 1.75, Cold Foil 1 per 24,
	// Marvel 1 per 110.
	UPR: {
		rare: 1.75,
		majestic: 1 / 4,
		token: 1.75,
		premiumLegendary: 1 / 80,
		marvel: 1 / 110,
		coldFoil: 1 / 24,
	},
	// Dynasty. PUBLISHED: Legendary 1 per 88 (Rainbow Foil), Majestic
	// 1 per 4, Rare 1.75, Common 7, Cold Foil 1 per 24, Marvel 1 per 96.
	DYN: {
		rare: 1.75,
		majestic: 1 / 4,
		premiumLegendary: 1 / 88,
		marvel: 1 / 96,
		coldFoil: 1 / 24,
	},
	// Outsiders. PUBLISHED: Legendary 1 per 70 (Rainbow Foil), Majestic
	// 1 per 5, Rare 1.75, Common 11, Token 1.75, Cold Foil 1 per 24,
	// Marvel 1 per 390.
	OUT: {
		majestic: 1 / 5,
		token: 1.75,
		premiumLegendary: 1 / 70,
		marvel: 1 / 390,
		coldFoil: 1 / 24,
	},
	// Dusk till Dawn. PUBLISHED: Legendary 1 per 64, Majestic 1 per 4,
	// Rare 1.68, Common 7, Cold Foil 1 per 24, Marvel 1 per 100.
	DTD: {
		rare: 1.68,
		majestic: 1 / 4,
		premiumLegendary: 1 / 64,
		marvel: 1 / 100,
		coldFoil: 1 / 24,
	},
	// Bright Lights. PUBLISHED: Legendary 1 per 70, Majestic 1 per 4,
	// Rare 1.68, Common 11, Token 1.8, Cold Foil 1 per 24. Marvel is
	// printed "1 per ??? packs" and takes the estimate. This is the one
	// set of its generation whose page gives no Premium Foil breakdown.
	EVO: {
		rare: 1.68,
		majestic: 1 / 4,
		token: 1.8,
		premiumLegendary: 1 / 70,
		marvel: ESTIMATED_MARVEL_CHANCE,
		coldFoil: 1 / 24,
	},

	// -----------------------------------------------------------------
	// The Heavy Hitters family. All four publish the same base block and
	// the same Premium Foil block, differing only in Token and Marvel.
	// PUBLISHED base: Majestic 1 per 4, Rare 1.83, Common 11.
	// PUBLISHED premium slot: Legendary 1 per 96, Majestic 1 per 18,
	// Rare 5 per 24, Common 18 per 24.
	HVY: {
		token: 1.85,
		marvel: 1 / 192,
	},
	MST: {
		token: 1.84,
		marvel: 1 / 100,
	},
	ROS: {
		token: 1.54,
		marvel: ESTIMATED_MARVEL_CHANCE,
	},
	HNT: {
		token: 1.54,
		marvel: ESTIMATED_MARVEL_CHANCE,
	},

	// -----------------------------------------------------------------
	// High Seas. PUBLISHED base: Majestic 1 per 4, Rare 1.83, Common 11.
	// PUBLISHED premium slot: Legendary 1 per 96, Majestic 1 per 18,
	// Rare 5 per 24, Common 18 per 24, Marvel 1 per 60. The only set of
	// its era with no Cold Foil line on its page at all, hence 0.
	SEA: {
		rare: 1.83,
		majestic: 1 / 4,
		premiumLegendary: 1 / 96,
		premiumMajestic: 1 / 18,
		premiumRare: 5 / 24,
		premiumMarvel: 1 / 60,
		coldFoil: 0,
	},
	// Super Slam. PUBLISHED: Set 1 per 8, Expansion 1 per 6, Super Rare
	// 1 per 2.18, Rare 1.42, Common 11, Cold Foil 1 per 24, and a premium
	// slot of Legendary 1 per 94, Majestic 1 per 22, Super Rare 1 per 13,
	// Rare 4 per 24, Common 17 per 24.
	// OBSERVED: about 10 Majestics per 24-pack display, i.e. 0.417 a
	// pack in total. Its page gives no base Majestic rate, so this is the
	// one rate in this file counted from real product rather than read
	// off a page. ESTIMATED: Marvel, which its page never mentions
	// despite the set printing 23 of them.
	SUP: {
		rare: 1.42,
		superRare: 1 / 2.18,
		majesticTotal: 10 / 24,
		set: 1 / 8,
		expansion: 1 / 6,
		premiumLegendary: 1 / 94,
		premiumMajestic: 1 / 22,
		premiumSuperRare: 1 / 13,
		premiumRare: 4 / 24,
		marvel: ESTIMATED_MARVEL_CHANCE,
		coldFoil: 1 / 24,
	},

	// -----------------------------------------------------------------
	// Mastery Pack Guardian. The one set here sourced from a product page
	// rather than a Collectors Centre page, because it has no Collectors
	// Centre page: LSS states which rarities each slot can hold but never
	// how often. PUBLISHED configuration, 13 cards a pack:
	//   Common 9 per pack / Rare or Majestic 1 per pack /
	//   Equipment 1 per pack / Token 1 per pack /
	//   Token or higher, Rainbow Foil or Cold Foil, 1 per pack
	// PUBLISHED set composition: 3 Legendary, 16 Majestic, 30 Rare,
	// 76 Common, 3 Token, 12 Marvel.
	//
	// POPULATION weights below carry the two slots whose split LSS does not
	// give. ESTIMATED: Legendary, Marvel and Cold Foil, none of which this
	// product publishes a rate for at all. Legendary takes the 1 per 96 that
	// almost every set with a published Legendary rate uses, which is a
	// borrowed figure, not this set's own.
	MPG: {
		popRare: 30,
		popMajestic: 16,
		popEquipmentCommon: 21,
		popEquipmentRare: 8,
		premiumLegendary: 1 / 96,
		marvel: ESTIMATED_MARVEL_CHANCE,
		coldFoil: COLD_FOIL_PER_DISPLAY,
	},

	// -----------------------------------------------------------------
	// Compendium of Rathe. PUBLISHED: Legendary 1 per 140, Majestic
	// 1 per 3.15, Rare 2.55, Common 5, Marvel 1 per 96, Cold Foil 1 per 8
	// (the most frequent of any set here), and a premium slot of Majestic
	// 1 per 24, Rare 5 per 24, Common 18 per 24.
	PEN: {
		rare: 2.55,
		majestic: 1 / 3.15,
		legendary: 1 / 140,
		premiumMajestic: 1 / 24,
		premiumRare: 5 / 24,
		marvel: 1 / 96,
		coldFoil: 1 / 8,
	},
	// Omens of the Third Age. PUBLISHED: Set 1 per 8, Expansion 1 per 7,
	// Rare 1.88, Common 11, Basic 1.8, Cold Foil 1 per 24, and a premium
	// slot of Legendary 1 per 96, Majestic 1 per 42, Rare 5.5 per 24,
	// Common 18 per 24. Like Super Slam it publishes no standalone
	// Majestic rate: its Majestics ARE the Set and Expansion content.
	// ESTIMATED: Marvel, listed in its Cold Foil block with no rate.
	OMN: {
		rare: 1.88,
		basic: 1.8,
		set: 1 / 8,
		expansion: 1 / 7,
		premiumLegendary: 1 / 96,
		premiumMajestic: 1 / 42,
		premiumRare: 5.5 / 24,
		marvel: ESTIMATED_MARVEL_CHANCE,
		coldFoil: 1 / 24,
	},
} as const;
