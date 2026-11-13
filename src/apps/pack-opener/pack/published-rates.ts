/**
 * EVERY NUMBER THAT DECIDES WHAT COMES OUT OF A PACK.
 *
 * Edit rates here; `pack/set-configs.ts` turns them into the weights the
 * generator draws with. Rates are per pack (`rare: 1.83` is 1.83 Rares a pack;
 * `majestic: 1 / 4` is one every 4 packs). Write `1 / 4`, not `0.25`, so the
 * source page stays checkable.
 *
 * Rates come from each set's Collectors Centre page on fabtcg.com, tagged:
 *
 *   PUBLISHED  printed on the set's own page
 *   OBSERVED   counted from real product, not published by LSS
 *   ESTIMATED  no number exists anywhere; a documented guess
 *   POPULATION how many cards the set prints at a rarity, used only where
 *              LSS states which rarities a slot can hold but not how often
 *
 * calibration.test.ts simulates packs and fails when the app and this file
 * disagree. Rates within one slot cannot sum past 1; slotTable throws at
 * startup naming the slot.
 */

/** Chance, per pack, of a Marvel in a set that prints real Marvels but
 * has no published rate for them. ESTIMATED: eight sets do publish one
 * (1 per 60, 96, 96, 100, 100, 110, 192 and 390 packs) and this is their
 * median. */
export const ESTIMATED_MARVEL_CHANCE = 1 / 100;

/** Fabled's chance per pack, as a share of the same set's Marvel chance.
 * ESTIMATED: no set publishes a Fabled rate (pages print "1 per ??? packs"). */
const FABLED_SHARE_OF_MARVEL = 0.5;

/** A set's Fabled chance per pack, from its own Marvel chance. Sets that
 * print no Marvel at all (the oldest ones) fall back to the Marvel estimate,
 * so their Fabled still lands at one per 200 packs rather than at zero. Sets
 * whose boosters contain no Fabled printing pass 0 explicitly instead of
 * calling this. */
export function fabledChanceFor(marvelChance: number): number {
	const basis = marvelChance > 0 ? marvelChance : ESTIMATED_MARVEL_CHANCE;
	return basis * FABLED_SHARE_OF_MARVEL;
}

/** Share of a set's Majestic rate that is expansion-slot content, where LSS
 * publishes no separate rate. It comes out of the published Majestic rate, not on
 * top of it. Super Slam and Omens publish their own and ignore this. */
export const EXPANSION_SHARE_OF_MAJESTIC = 0.2;

/** The standard cold-foil rate: one per display of 24 packs. Sets that state a
 * different one (Everfest 1 per 16, Compendium of Rathe 1 per 8) use their own. */
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
	// Super Rare 1 per 6, Rare 1.75, Common 12, Token 1. Legendary sits in the
	// Equipment slot.
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
	// Rare 1.65, Common 7. Its Fabled and Marvel cards are Black Label only, hence
	// no marvel rate.
	"1HP": {
		rare: 1.65,
		majestic: 1 / 3.15,
		legendary: 1 / 82,
		// No Cold Foil line on the page; Marvels are Black Label only.
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
	// Super Slam. PUBLISHED: Set 1 per 8, Expansion 1 per 6, Super Rare 1 per 2.18,
	// Rare 1.42, Common 11, Cold Foil 1 per 24, and a premium slot of Legendary
	// 1 per 94, Majestic 1 per 22, Super Rare 1 per 13, Rare 4 per 24, Common 17 per 24.
	// OBSERVED: about 10 Majestics per 24-pack display (0.417 a pack in total); the
	// page gives no base Majestic rate. ESTIMATED: Marvel, which the page never
	// mentions.
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

	// Mastery Pack Guardian. Sourced from a product page (no Collectors Centre page).
	// PUBLISHED, 13 cards:
	//   Common 9 / Rare or Majestic 1 / Equipment 1 / Token 1 /
	//   Token or higher, Rainbow Foil or Cold Foil, 1
	// PUBLISHED composition: 3 Legendary, 16 Majestic, 30 Rare, 76 Common, 3 Token,
	// 12 Marvel.
	// POPULATION: the two slots whose split LSS does not give. ESTIMATED: Legendary
	// (the common 1 per 96), Marvel and Cold Foil.
	MPG: {
		popRare: 30,
		popMajestic: 16,
		popEquipmentCommon: 21,
		popEquipmentRare: 8,
		premiumLegendary: 1 / 96,
		marvel: ESTIMATED_MARVEL_CHANCE,
		coldFoil: COLD_FOIL_PER_DISPLAY,
	},

	// Mastery Pack Warrior. Sourced from a product page (no Collectors Centre page),
	// from fabtcg.com/products/product/mastery-pack-warrior/. PUBLISHED, 13 cards:
	//   Common 8 / Rare or Majestic 2 (1 Rare + 1 Rare or Majestic) /
	//   Rainbow Foil 1 / Basic 2 (1 Basic + 1 Basic, Legendary, Cold Foil or Marvel)
	// PUBLISHED composition: 9 Marvel, 4 Legendary, 20 Majestic, 40 Rare, 80 Common,
	// 10 Basic.
	// POPULATION: the second Rare-or-Majestic card (Rare/Majestic counts) and the
	// Rainbow Foil card (Rainbow printings per rarity). The latter excludes Legendary,
	// which LSS lists under the Basic slot; including it would deal it twice.
	// ESTIMATED: Legendary, Marvel and Cold Foil, taken from Mastery Pack Guardian.
	MPW: {
		popRare: 40,
		popMajestic: 20,
		popRainbowCommon: 46,
		popRainbowRare: 31,
		popRainbowMajestic: 16,
		legendary: 1 / 96,
		marvel: ESTIMATED_MARVEL_CHANCE,
		coldFoil: COLD_FOIL_PER_DISPLAY,
	},

	// -----------------------------------------------------------------
	// GEM Packs 1 to 5. PUBLISHED configuration (GEM Pack FAQ), the same for every pack:
	//   3 cards: 1 regular print, 1 premium foil (Rainbow Foil, Cold Foil or Marvel),
	//   1 art card.
	// Every GEM printing is Promo, so slots differ by foiling and the only number to
	// tune is how often the premium card is Cold Foil.
	// POPULATION: each pack's own Cold-to-Rainbow printing count stands in for a rate
	// LSS does not publish.
	GEM1: { popRainbow: 22, popCold: 10 },
	GEM2: { popRainbow: 26, popCold: 9 },
	GEM3: { popRainbow: 28, popCold: 8 },
	GEM4: { popRainbow: 28, popCold: 8 },
	GEM5: { popRainbow: 35, popCold: 9 },

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

	// Usurp the Shadow Throne. ESTIMATED: no Collectors Centre page exists yet, so
	// every value is Omens of the Third Age's, copied (not aliased) because the pack
	// structure is identical and the set composition is close. Replace with this
	// set's own figures, and update calibration.test.ts, once it is published.
	IAR: {
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

	// -----------------------------------------------------------------
	// Compendium of Rathe - Antiquity Pack (3-card bonus pack). PUBLISHED as LSS's
	// "Estimated Rarity Breakdown":
	//   1 Marvel (1 per 800) / 3 Fabled (1 per 45) / 7 Legendary (1 per 20) /
	//   17 Majestic: Regular 7 per 8, Cold Foil 1 per 8 / 10 Rare (1 per pack) /
	//   3 Puzzles (1 per pack)
	// The puzzle slot is not modelled: its 27 cards are in no upstream data, so this
	// opens as a two-card pack. Legendary, which LSS deals from the puzzle slot, is
	// folded into the Rare slot (see set-configs.ts's ANTIQUITY_PACK).
	ANQ: {
		marvel: 1 / 800,
		fabled: 1 / 45,
		legendary: 1 / 20,
		// The whole Majestic slot, regular and Cold Foil together: 7/8 + 1/8.
		majestic: 1,
		// Cold Foil is published as an outcome of the Majestic slot itself,
		// not of a separate one, so that is the card it upgrades.
		coldFoil: 1 / 8,
	},
} as const;
