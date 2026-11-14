import {
	COLD_FOIL_PER_DISPLAY,
	EXPANSION_SHARE_OF_MAJESTIC,
	fabledChanceFor,
	HVY_FAMILY_RATES,
	PUBLISHED_RATES,
} from "@fabkit/apps/pack-opener/pack/published-rates";
import { slotTable } from "@fabkit/apps/pack-opener/pack/slot-table";
import type { PackConfig } from "@fabkit/apps/pack-opener/pack/types";

/**
 * Real per-set pack configs, verified against each set's fabtcg.com pages and
 * sanity-checked against its printed card population (scripts/build-pack-data.ts).
 * Frequencies are held to the published figures by calibration.test.ts.
 *
 * - Where LSS states a slot's membership without the split, weights are the set's
 *   own per-rarity printing counts (an approximation, not a sourced pull-weight).
 *   Rarities not named by any slot are folded into the premium slot.
 * - Wildcard slots omit Basic where the set prints no non-expansion Basic, rather
 *   than leave a weight pointing at an empty pool.
 * - "X or Expansion Slot" is one extra rarityTable entry with `expansionSlot: true`,
 *   using Majestic as the representative rarity.
 * - "1 per display" cold foil is 1/24: a display is 24 packs.
 */
const PUBLISHED_COLD_FOIL_CHANCE = COLD_FOIL_PER_DISPLAY;

// ---------------------------------------------------------------------------
// Everfest (EVR) — 10 cards. fabtcg.com/products/booster-set/everfest/
// "Premium Foil - 1 (Rainbow Foil or Cold Foil); Rare or higher - 2 (1 Rare/
// Majestic/Legendary); Common - 7".
// Real population: rare 61, majestic 45, legendary 3, plus one Cold Foil Fabled.
// No Basic, Token or Marvel printings, so marvelChance is 0 (a nonzero value would
// draw from an empty pool).
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/everfest/. Weights come from
// published-rates.ts's EVR block split across the two slots, Common taking the slack.
// Fabled is "1 per ??? packs", so it takes fabledChanceFor.
const evrRareOrHigherTable = slotTable(
	"Everfest's two Rare-or-higher slots",
	[
		{ rarity: "rare", perPack: PUBLISHED_RATES.EVR.rare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.EVR.majestic },
		{ rarity: "legendary", perPack: PUBLISHED_RATES.EVR.legendary },
	],
	"common",
	2,
);
const evrPremiumTable = [{ rarity: "common" as const, weight: 1 }];

const EVERFEST: PackConfig = {
	id: "EVR",
	cardsPerPack: 10,
	slots: [
		{
			kind: "common",
			count: 7,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare-or-majestic", count: 2, rarityTable: evrRareOrHigherTable },
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: evrPremiumTable,
		},
	],
	// "Rainbow Foil or Cold Foil" with no ratio and no token/basic slot to replace, so
	// coldFoilReplaces targets the premium slot (see generate-pack.ts).
	// Published as 1 per 16 packs on the Collectors Centre page.
	coldFoilChance: PUBLISHED_RATES.EVR.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
	fabledChance: fabledChanceFor(0),
};

// ---------------------------------------------------------------------------
// Uprising (UPR) — 16 cards. fabtcg.com/products/booster-set/uprising/
// "Rainbow Foil - 1; Rare or higher - 2 (1 Rare + 1 Rare/Majestic); Common - 11;
// Token - 2; Cold Foil - 1 per display". Rainbow Foil is its own card (1+2+11+2).
// Real population: rare 51, majestic 27, legendary 6, token 16, marvel 16.
//
// The page never names Legendary or Marvel: Legendary goes in the premium slot and
// Marvel is rolled via marvelChance. The page doesn't say what Cold Foil replaces;
// Token is inferred from later sets.
//
// The named pair already carries Rare and Majestic, so reusing its table for the
// premium slot would double-count: Premium Foil is Common-primary with Legendary.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/uprising/. Rare 1.75 is one
// guaranteed plus 0.75 from the pair. The two token slots share the published 1.75.
// No expansion-slot Majestic exists (pool-viability.test.ts), so Majestic stays whole.
const uprRareOrMajesticTable = slotTable(
	"Uprising's Rare-or-Majestic slot",
	[{ rarity: "majestic", perPack: PUBLISHED_RATES.UPR.majestic }],
	"rare",
);
const uprPremiumTable = slotTable(
	"Uprising's Premium Foil slot",
	[{ rarity: "legendary", perPack: PUBLISHED_RATES.UPR.premiumLegendary }],
	"common",
);
const uprTokenTable = slotTable(
	"Uprising's two Token slots",
	[{ rarity: "token", perPack: PUBLISHED_RATES.UPR.token }],
	"common",
	2,
);

const UPRISING: PackConfig = {
	id: "UPR",
	cardsPerPack: 16,
	slots: [
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: uprRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: uprPremiumTable,
		},
		{ kind: "token", count: 2, rarityTable: uprTokenTable },
	],
	coldFoilChance: PUBLISHED_RATES.UPR.coldFoil,
	coldFoilReplaces: "token",
	// The Collectors Centre page prints "1 per ??? packs", but LSS has
	// since published Uprising's Marvel rate as 1 per 110 packs.
	marvelChance: PUBLISHED_RATES.UPR.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.UPR.marvel),
};

// ---------------------------------------------------------------------------
// Dynasty (DYN) — 10 cards. fabtcg.com/products/booster-set/dynasty/
// "Premium Foil - 1; Rare or higher - 2 (1 Rare + 1 Rare/Majestic); Common - 7".
// Cold Foil comes from the Collectors Centre page (1 per 24).
// Real population: rare 81, majestic 51, legendary 5, marvel 14. Same shape as
// Uprising: Premium Foil is Common-primary with Legendary.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/dynasty/. No expansion-slot
// Majestic (pool-viability.test.ts), so Majestic stays whole.
const dynRareOrMajesticTable = slotTable(
	"Dynasty's Rare-or-Majestic slot",
	[{ rarity: "majestic", perPack: PUBLISHED_RATES.DYN.majestic }],
	"rare",
);
// Legendary at the published Rainbow Foil rate of 1 per 88 packs.
const dynPremiumTable = slotTable(
	"Dynasty's Premium Foil slot",
	[{ rarity: "legendary", perPack: PUBLISHED_RATES.DYN.premiumLegendary }],
	"common",
);

const DYNASTY: PackConfig = {
	id: "DYN",
	cardsPerPack: 10,
	slots: [
		{
			kind: "common",
			count: 7,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: dynRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: dynPremiumTable,
		},
	],
	// The page publishes "Cold Foil (1:24)" but not what it replaces. This
	// pack has no token or basic slot, so it targets the Rare, same as Dusk
	// till Dawn below. That target is an inference; the rate is published.
	coldFoilChance: PUBLISHED_RATES.DYN.coldFoil,
	coldFoilReplaces: "rare",
	// The Collectors Centre page prints "1 per ??? packs", but LSS has
	// since published Dynasty's Marvel rate as 1 per 96 packs.
	marvelChance: PUBLISHED_RATES.DYN.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.DYN.marvel),
};

// ---------------------------------------------------------------------------
// Dusk till Dawn (DTD) — 10 cards. fabtcg.com/en/products/booster-set/dusk-till-dawn/
// "Cold Foil - 1 per display (replaces a Rare); Rainbow Foil - 1; Rare or higher - 2
// (1 Rare + 1 Rare or Majestic); Common - 7". Rainbow Foil is separate.
// Real population: rare 77, majestic 56, legendary 8, marvel 10.
// Premium Foil is Common-primary with a Legendary sliver (no double-counting, as
// in Uprising).
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/dusk-till-dawn/. Rare 1.68 is one
// guaranteed plus 0.68 from the pair's second half. Unlike later sets it prints no
// expansion-slot Majestic (pool-viability.test.ts), so Majestic stays whole.
const dtdRareOrMajesticTable = slotTable(
	"Dusk till Dawn's Rare-or-Majestic slot",
	[
		// One of the published 1.68 Rares is the guaranteed slot before this.
		{ rarity: "rare", perPack: PUBLISHED_RATES.DTD.rare - 1 },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.DTD.majestic },
	],
	"common",
);
// Legendary at the published 1 per 64 packs.
const dtdPremiumTable = slotTable(
	"Dusk till Dawn's Premium Foil slot",
	[{ rarity: "legendary", perPack: PUBLISHED_RATES.DTD.premiumLegendary }],
	"common",
);

const DUSK_TILL_DAWN: PackConfig = {
	id: "DTD",
	cardsPerPack: 10,
	slots: [
		{
			kind: "common",
			count: 7,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: dtdRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: dtdPremiumTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.DTD.coldFoil,
	coldFoilReplaces: "rare",
	// The Collectors Centre page prints "1 per ??? packs", but LSS has
	// since published Dusk till Dawn's Marvel rate as 1 per 100 packs.
	marvelChance: PUBLISHED_RATES.DTD.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.DTD.marvel),
};

// ---------------------------------------------------------------------------
// Heavy Hitters / Part the Mistveil / Rosetta / The Hunted family — 16 cards each.
// Rates come from their Collectors Centre pages, which share one shape: a base
// block, a "Premium Foil (1 per pack)" block, then a Cold Foil block.
//
// Base: Majestic 1 per 4, Rare 1.83, Common 11, Token 1.85 (HVY). With the Premium
// Foil card those sum to 15.93, so there is no Basic: the product page's wildcard
// slot is not modelled.
//
// The Premium Foil block (Legendary 1/96, Majestic 1/18, Rare 5/24, Common 18/24)
// sums to 1.02, so it is that one card's table. Legendary is drawn there only.
//
// The other slots are a guaranteed Rare, a Rare-or-Majestic, a guaranteed Token and a
// Token-or-Common that absorbs the slack in the set's token rate (the only base number
// that differs). Rosetta's "Puzzle" insert lands there too, having no rarity.
//
// Expansion-slot printings are Majestic, so they come OUT of the published Majestic
// rate: a fifth is routed to an expansion entry.
//
// Marvel is published for HVY and MST; ROS and HNT take ESTIMATED_MARVEL_CHANCE.
// Marvels are Cold Foil, so they are rolled onto the premium slot (generate-pack.ts).
// ---------------------------------------------------------------------------

/** The Premium Foil slot's rarity table, shared by all four sets. Fabled is not here:
 * fabledChanceFor rolls it separately, as an estimate. */
const hvyFamilyPremiumTable = slotTable(
	"the Heavy Hitters family's Premium Foil slot",
	[
		{ rarity: "rare", perPack: HVY_FAMILY_RATES.premiumRare },
		{ rarity: "majestic", perPack: HVY_FAMILY_RATES.premiumMajestic },
		{ rarity: "legendary", perPack: HVY_FAMILY_RATES.premiumLegendary },
	],
	"common",
);

/** The published Majestic rate (1 per 4 packs) split 4:1 between ordinary
 * and expansion-slot printings. The split is ours; the total is LSS's, and
 * the total is what tests/pack-opener/calibration.test.ts asserts. */
const hvyFamilyRareOrMajesticTable = slotTable(
	"the Heavy Hitters family's Rare-or-Majestic slot",
	[
		{
			rarity: "majestic",
			perPack: HVY_FAMILY_RATES.majestic * (1 - EXPANSION_SHARE_OF_MAJESTIC),
		},
		{
			rarity: "majestic",
			perPack: HVY_FAMILY_RATES.majestic * EXPANSION_SHARE_OF_MAJESTIC,
			expansionSlot: true,
		},
	],
	"rare",
);

function buildHvyFamilyConfig(
	id: string,
	/** The set's own published Token rate per pack, the only published
	 * number that differs across these four. */
	tokenRate: number,
	/** Published where LSS gives one, ESTIMATED_MARVEL_CHANCE where it
	 * prints "1 per ??? packs". */
	marvelChance: number,
): PackConfig {
	// Two token slots, one of them guaranteed, so the second lands on a
	// token often enough to make up the published rate and on a Common the
	// rest of the time.
	const secondTokenTable = slotTable(
		`${id}'s second Token slot`,
		[{ rarity: "token", perPack: tokenRate - 1 }],
		"common",
	);
	return {
		id,
		cardsPerPack: 16,
		slots: [
			{
				kind: "common",
				count: 11,
				rarityTable: [{ rarity: "common", weight: 1 }],
			},
			{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
			{
				kind: "rare-or-majestic",
				count: 1,
				rarityTable: hvyFamilyRareOrMajesticTable,
			},
			{
				kind: "premium-foil",
				count: 1,
				fixedTreatment: "rainbow",
				rarityTable: hvyFamilyPremiumTable,
			},
			{
				kind: "token",
				count: 1,
				rarityTable: [{ rarity: "token", weight: 1 }],
			},
			{
				kind: "token-or-wildcard",
				count: 1,
				rarityTable: secondTokenTable,
			},
		],
		coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
		coldFoilReplaces: "token",
		marvelChance,
		fabledChance: fabledChanceFor(marvelChance),
	};
}

const HEAVY_HITTERS = buildHvyFamilyConfig(
	"HVY",
	PUBLISHED_RATES.HVY.token,
	PUBLISHED_RATES.HVY.marvel,
);
const PART_THE_MISTVEIL = buildHvyFamilyConfig(
	"MST",
	PUBLISHED_RATES.MST.token,
	PUBLISHED_RATES.MST.marvel,
);
const ROSETTA = buildHvyFamilyConfig(
	"ROS",
	PUBLISHED_RATES.ROS.token,
	PUBLISHED_RATES.ROS.marvel,
);
const THE_HUNTED = buildHvyFamilyConfig(
	"HNT",
	PUBLISHED_RATES.HNT.token,
	PUBLISHED_RATES.HNT.marvel,
);

// ---------------------------------------------------------------------------
// Super Slam (SUP) — 15 cards. fabtcg.com/en/products/booster-set/super-slam/:
// "Cold Foil - 1 per 24 packs (replaces a Basic); Rainbow Foil - 1; Rare or higher -
// 2 (1 Rare + 1 Rare, Super Rare, or Majestic); Common - 11; Basic / Expansion Slot /
// Legendary / Marvel - 1". Rainbow Foil is its own card (11 + 2 + 1 + 1 = 15).
// Real population: rare 40, superrare 40, majestic 14, legendary 2, basic 9, marvel 8
// (marvel/legendary exclude expansion-slot printings).
//
// Rates from https://fabtcg.com/collectors-centre/super-slam/. The Premium Foil block
// sums to 1.01, so it is that slot's own table; Legendary is drawn there only.
// Premium Foil is Common-only for the base rates, since Legendary has its own channel
// in the wildcard slot.
//
// Set content (1 per 8) is the set's 14 plain Majestics; Expansion (1 per 6) is its
// expansion-slot printings, carried in the wildcard. The base Majestic has no
// published rate, so the 0.08 gap to the OBSERVED 0.417 a pack rides in the wildcard
// as ordinary Majestic, which Basic gives up weight for.
// ---------------------------------------------------------------------------
const supRareOrHigherTable = slotTable(
	"Super Slam's Rare-or-higher slot",
	[
		{ rarity: "superrare", perPack: PUBLISHED_RATES.SUP.superRare },
		// The published "Set" content, as distinct from the "Expansion"
		// content, which rides in the wildcard slot below.
		{ rarity: "majestic", perPack: PUBLISHED_RATES.SUP.set },
	],
	"rare",
);
// The published premium breakdown over 10,000 packs.
const supPremiumTable = slotTable(
	"Super Slam's Premium Foil slot",
	[
		{ rarity: "rare", perPack: PUBLISHED_RATES.SUP.premiumRare },
		{ rarity: "superrare", perPack: PUBLISHED_RATES.SUP.premiumSuperRare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.SUP.premiumMajestic },
		{ rarity: "legendary", perPack: PUBLISHED_RATES.SUP.premiumLegendary },
	],
	"common",
);

/** Whatever the observed Majestic total leaves once the published Set,
 * Expansion and Premium Foil Majestics are accounted for. See the SUP
 * entry in pack/published-rates.ts for where 10 per 24 packs comes from. */
const supOrdinaryMajestic =
	PUBLISHED_RATES.SUP.majesticTotal -
	PUBLISHED_RATES.SUP.set -
	PUBLISHED_RATES.SUP.expansion -
	PUBLISHED_RATES.SUP.premiumMajestic;

const supWildcardTable = slotTable(
	"Super Slam's Basic wildcard slot",
	[
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.SUP.expansion,
			expansionSlot: true,
		},
		{ rarity: "majestic", perPack: supOrdinaryMajestic },
	],
	"basic",
);

const SUPER_SLAM: PackConfig = {
	id: "SUP",
	cardsPerPack: 15,
	slots: [
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-super-rare-plus",
			count: 1,
			rarityTable: supRareOrHigherTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: supPremiumTable,
		},
		{
			kind: "basic-or-wildcard",
			count: 1,
			rarityTable: supWildcardTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.SUP.coldFoil,
	coldFoilReplaces: "basic-or-wildcard",
	// This set prints 23 Marvels but its page never mentions them, so
	// there is no rate to carry. Left at 0 they would be unpullable,
	// which is worse than an openly flagged estimate.
	marvelChance: PUBLISHED_RATES.SUP.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.SUP.marvel),
};

// ---------------------------------------------------------------------------
// Omens of the Third Age (OMN) — 16 cards. omen.fabtcg.com, "Rarity Distribution":
// "Cold Foil - 1 per 24 packs (replaces a Basic); Common - 11; Rare or Majestic - 2
// (1 Rare + 1 Rare or Majestic); Rainbow Foil - 1; Basic - 2 (1 Basic + 1 Basic,
// Expansion Slot, Legendary, Marvel, or Fabled)". Rainbow Foil is a separate card.
//
// Rates are from the Collectors Centre breakdown (read by hand; it renders behind JS
// tabs). The premium block sums to 1.01, so it describes one card. No standalone
// Majestic rate: Set and Expansion content are the Majestics, and together they
// exceed what the Rare-or-Majestic slot can carry, so the Expansion share rides in
// the Basic wildcard (where the page puts Expansion Slot content). Marvel takes the
// estimate.
// ---------------------------------------------------------------------------
const omnRareOrMajesticTable = slotTable(
	"Omens of the Third Age's Rare-or-Majestic slot",
	[
		// The published "Set" content; "Expansion" rides in the wildcard.
		{ rarity: "majestic", perPack: PUBLISHED_RATES.OMN.set },
	],
	"rare",
);
// The published premium breakdown over 10,000 packs.
const omnPremiumTable = slotTable(
	"Omens of the Third Age's Premium Foil slot",
	[
		{ rarity: "rare", perPack: PUBLISHED_RATES.OMN.premiumRare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.OMN.premiumMajestic },
		{ rarity: "legendary", perPack: PUBLISHED_RATES.OMN.premiumLegendary },
	],
	"common",
);

const omnWildcardTable = slotTable(
	"Omens of the Third Age's Basic wildcard slot",
	[
		// One of the published 1.8 Basics is the guaranteed slot before this.
		{ rarity: "basic", perPack: PUBLISHED_RATES.OMN.basic - 1 },
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.OMN.expansion,
			expansionSlot: true,
		},
	],
	"common",
);

const OMENS_OF_THE_THIRD_AGE: PackConfig = {
	id: "OMN",
	cardsPerPack: 16,
	slots: [
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: omnRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: omnPremiumTable,
		},
		{ kind: "basic", count: 1, rarityTable: [{ rarity: "basic", weight: 1 }] },
		{
			kind: "basic-or-wildcard",
			count: 1,
			rarityTable: omnWildcardTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.OMN.coldFoil,
	coldFoilReplaces: "basic",
	// Listed in the Cold Foil block with no rate attached.
	marvelChance: PUBLISHED_RATES.OMN.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.OMN.marvel),
};
// ---------------------------------------------------------------------------
// Usurp the Shadow Throne (IAR) — 16 cards.
// fabtcg.com/products/booster-set/iar/ (captured 2026-09-15, before release):
// "Cold Foil - 1 per 24 packs (replaces a Basic); Rainbow Foil - 1; Common - 11;
// Rare or Majestic - 2 (1 Rare + 1 Rare or Majestic); Basic - 2 (1 Basic + 1 Basic,
// Expansion Slot, Legendary, Marvel, or Fabled)". Structurally identical to Omens
// of the Third Age. Real population: 2 Fabled, 27 Marvel, 5 Legendary, 40 Majestic
// (20 Core + 20 Expansion), 66 Rare, 133 Common, 16 Basic.
//
// No Collectors Centre page exists yet, so PUBLISHED_RATES.IAR is Omens' rates,
// copied (ESTIMATED). Replace it and update calibration.test.ts when the page is
// live. Card data comes from the PRE_RELEASE_SETS bridge in scripts/build-pack-data.ts.
// ---------------------------------------------------------------------------
const iarRareOrMajesticTable = slotTable(
	"Usurp the Shadow Throne's Rare-or-Majestic slot",
	[
		// The published (borrowed) "Set" content; "Expansion" rides in the
		// wildcard, same split as Omens above.
		{ rarity: "majestic", perPack: PUBLISHED_RATES.IAR.set },
	],
	"rare",
);
const iarPremiumTable = slotTable(
	"Usurp the Shadow Throne's Premium Foil slot",
	[
		{ rarity: "rare", perPack: PUBLISHED_RATES.IAR.premiumRare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.IAR.premiumMajestic },
		{ rarity: "legendary", perPack: PUBLISHED_RATES.IAR.premiumLegendary },
	],
	"common",
);

const iarWildcardTable = slotTable(
	"Usurp the Shadow Throne's Basic wildcard slot",
	[
		// One of the (borrowed) published 1.8 Basics is the guaranteed slot
		// before this.
		{ rarity: "basic", perPack: PUBLISHED_RATES.IAR.basic - 1 },
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.IAR.expansion,
			expansionSlot: true,
		},
	],
	"common",
);

const USURP_THE_SHADOW_THRONE: PackConfig = {
	id: "IAR",
	cardsPerPack: 16,
	slots: [
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: iarRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: iarPremiumTable,
		},
		{ kind: "basic", count: 1, rarityTable: [{ rarity: "basic", weight: 1 }] },
		{
			kind: "basic-or-wildcard",
			count: 1,
			rarityTable: iarWildcardTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.IAR.coldFoil,
	coldFoilReplaces: "basic",
	marvelChance: PUBLISHED_RATES.IAR.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.IAR.marvel),
};
// ---------------------------------------------------------------------------
// Welcome to Rathe (WTR) — 16 cards.
// fabtcg.com/products/booster-set/welcome-to-rathe/ (the-fab-cube's product_page 404s).
// "1 Token; 4 Generic Commons; 7 Class Commons; 1 Rare; 1 Rare / Super Rare /
// Majestic; 1 Equipment; 1 Premium Foil (can be from any non-token rarity)".
//
// All 5 real Legendary printings are Equipment, so the published 1 per 96 is the
// Equipment slot's Legendary weight, the other 95/96 landing on its 12 Equipment
// Commons. The Rare/Super Rare/Majestic slot alone explains the rest of the
// published spread (its own rate sums to exactly 1), so Premium Foil is Common:
// giving it Rare+ chances overshoots the published rates about 1.5x.
//
// Cold Foil is a flat 1/24 on the Premium Foil slot. The app doesn't distinguish
// Alpha from Unlimited print runs, so this over-applies to Unlimited.
// ---------------------------------------------------------------------------
const wtrRareOrHigherTable = slotTable(
	"WTR's Rare-or-higher slot",
	[
		{ rarity: "superrare", perPack: PUBLISHED_RATES.WTR.superRare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.WTR.majestic },
	],
	"rare",
);
const wtrPremiumTable = [{ rarity: "common" as const, weight: 1 }];
const wtrEquipmentTable = slotTable(
	"WTR's Equipment slot",
	[
		{
			rarity: "legendary",
			perPack: PUBLISHED_RATES.WTR.equipmentLegendary,
			requiresType: "Equipment",
		},
	],
	{ rarity: "common", requiresType: "Equipment" },
);

const WELCOME_TO_RATHE: PackConfig = {
	id: "WTR",
	cardsPerPack: 16,
	slots: [
		{ kind: "token", count: 1, rarityTable: [{ rarity: "token", weight: 1 }] },
		{
			kind: "generic-common",
			count: 4,
			rarityTable: [{ rarity: "common", weight: 1, classRestricted: false }],
		},
		{
			kind: "class-common",
			count: 7,
			rarityTable: [{ rarity: "common", weight: 1, classRestricted: true }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-super-rare-plus",
			count: 1,
			rarityTable: wtrRareOrHigherTable,
		},
		{ kind: "equipment", count: 1, rarityTable: wtrEquipmentTable },
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: wtrPremiumTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.WTR.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
	fabledChance: fabledChanceFor(0),
};

// ---------------------------------------------------------------------------
// Arcane Rising (ARC) — 16 cards. Same structure and rates as Welcome to Rathe,
// including all Legendary being Equipment. fabtcg.com/products/booster-set/arcane-rising/
// Cold Foil: 1 per 24 packs.
// Real population: common 126, rare 48, super rare 15, majestic 10,
// legendary 5 (all Equipment), token 14.
// ---------------------------------------------------------------------------
const arcRareOrHigherTable = slotTable(
	"ARC's Rare-or-higher slot",
	[
		{ rarity: "superrare", perPack: PUBLISHED_RATES.ARC.superRare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.ARC.majestic },
	],
	"rare",
);
const arcPremiumTable = [{ rarity: "common" as const, weight: 1 }];
const arcEquipmentTable = slotTable(
	"ARC's Equipment slot",
	[
		{
			rarity: "legendary",
			perPack: PUBLISHED_RATES.ARC.equipmentLegendary,
			requiresType: "Equipment",
		},
	],
	{ rarity: "common", requiresType: "Equipment" },
);

const ARCANE_RISING: PackConfig = {
	id: "ARC",
	cardsPerPack: 16,
	slots: [
		{ kind: "token", count: 1, rarityTable: [{ rarity: "token", weight: 1 }] },
		{
			kind: "generic-common",
			count: 4,
			rarityTable: [{ rarity: "common", weight: 1, classRestricted: false }],
		},
		{
			kind: "class-common",
			count: 7,
			rarityTable: [{ rarity: "common", weight: 1, classRestricted: true }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-super-rare-plus",
			count: 1,
			rarityTable: arcRareOrHigherTable,
		},
		{ kind: "equipment", count: 1, rarityTable: arcEquipmentTable },
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: arcPremiumTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.ARC.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
	fabledChance: fabledChanceFor(0),
};

// ---------------------------------------------------------------------------
// Crucible of War (CRU) — 10 cards. fabtcg.com/products/booster-set/crucible-of-war/
// "7 Commons; 1 Rare; 1 Rare / Majestic / Legendary; 1 Premium Foil". No Token or
// Equipment slot.
//
// Legendary is named in the slot, so its published rate applies directly. The
// guaranteed Rare covers 1.0 of the 1.75, so the slot's own Rare is 0.75; that leaves
// nothing for Premium Foil, which is Common. Cold Foil is 1 per 22 packs on it.
// ---------------------------------------------------------------------------
const cruRareOrHigherTable = slotTable(
	"Crucible of War's Rare-or-higher slot",
	[
		{ rarity: "majestic", perPack: PUBLISHED_RATES.CRU.majestic },
		{ rarity: "legendary", perPack: PUBLISHED_RATES.CRU.legendary },
	],
	"rare",
);
const cruPremiumTable = [{ rarity: "common" as const, weight: 1 }];

const CRUCIBLE_OF_WAR: PackConfig = {
	id: "CRU",
	cardsPerPack: 10,
	slots: [
		{
			kind: "common",
			count: 7,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: cruRareOrHigherTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: cruPremiumTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.CRU.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
	fabledChance: fabledChanceFor(0),
};

// ---------------------------------------------------------------------------
// Monarch (MON) — 16 cards. fabtcg.com/products/booster-set/monarch-unlimited/ (the
// First Edition slug redirects to a Blitz Deck page).
// "Token - 1; Premium Foil - 1 (Rainbow Foil); Rare or higher - 1 + 1 (1 Rare + 1
// Rare/Majestic); Equipment - 1; Common - 11". No Super Rare printings.
//
// Legendary is not named in "Rare or higher"; as in Welcome to Rathe, its 1 per 96
// is the Equipment slot's weight. Premium Foil is Common, to avoid double-counting.
// Cold Foil is 1 per 22 packs on the premium slot.
// ---------------------------------------------------------------------------
const monRareOrMajesticTable = slotTable(
	"Monarch's Rare-or-Majestic slot",
	[{ rarity: "majestic", perPack: PUBLISHED_RATES.MON.majestic }],
	"rare",
);
const monPremiumTable = [{ rarity: "common" as const, weight: 1 }];
const monEquipmentTable = slotTable(
	"Monarch's Equipment slot",
	[
		{
			rarity: "legendary",
			perPack: PUBLISHED_RATES.MON.equipmentLegendary,
			requiresType: "Equipment",
		},
	],
	{ rarity: "common", requiresType: "Equipment" },
);

const MONARCH: PackConfig = {
	id: "MON",
	cardsPerPack: 16,
	slots: [
		{ kind: "token", count: 1, rarityTable: [{ rarity: "token", weight: 1 }] },
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: monPremiumTable,
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: monRareOrMajesticTable,
		},
		{ kind: "equipment", count: 1, rarityTable: monEquipmentTable },
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
	],
	coldFoilChance: PUBLISHED_RATES.MON.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
	fabledChance: fabledChanceFor(0),
};

// ---------------------------------------------------------------------------
// Tales of Aria (ELE) — 16 cards. fabtcg.com/products/booster-set/tales-of-aria/
// "Premium Foil - 1 per pack (Rainbow Foil or Cold Foil); Rare or higher - 1 + 1;
// Common - 12; Token - 1". No Equipment slot.
//
// The pair is "1 Rare + 1 Rare/Majestic" with no Legendary, so Legendary goes in the
// Premium Foil slot (1/88). Cold Foil is 1 per 20 packs on the premium slot.
// ---------------------------------------------------------------------------
const eleRareOrMajesticTable = slotTable(
	"Tales of Aria's Rare-or-Majestic slot",
	[{ rarity: "majestic", perPack: PUBLISHED_RATES.ELE.majestic }],
	"rare",
);
const elePremiumTable = slotTable(
	"Tales of Aria's Premium Foil slot",
	[{ rarity: "legendary", perPack: PUBLISHED_RATES.ELE.premiumLegendary }],
	"common",
);

const TALES_OF_ARIA: PackConfig = {
	id: "ELE",
	cardsPerPack: 16,
	slots: [
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: elePremiumTable,
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: eleRareOrMajesticTable,
		},
		{
			kind: "common",
			count: 12,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "token", count: 1, rarityTable: [{ rarity: "token", weight: 1 }] },
	],
	coldFoilChance: PUBLISHED_RATES.ELE.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
	fabledChance: fabledChanceFor(0),
};

// ---------------------------------------------------------------------------
// Bright Lights (EVO) — 16 cards. Rates from https://fabtcg.com/collectors-centre/bright-lights/
//
// The Heavy Hitters shape, but not built by that builder because its page gives no
// Premium Foil breakdown: the premium card is a Common carrying the one published
// Legendary rate. The rates sum to 15.73, so the sixteenth card is a second
// Token/Common slot, not a Basic wildcard. Marvel takes the estimate.
// ---------------------------------------------------------------------------
const evoRareOrMajesticTable = slotTable(
	"Bright Lights' Rare-or-Majestic slot",
	[
		// One of the published 1.68 Rares is the guaranteed slot before this.
		{ rarity: "rare", perPack: PUBLISHED_RATES.EVO.rare - 1 },
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.EVO.majestic * (1 - EXPANSION_SHARE_OF_MAJESTIC),
		},
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.EVO.majestic * EXPANSION_SHARE_OF_MAJESTIC,
			expansionSlot: true,
		},
	],
	"common",
);
// Legendary at the published 1 per 70 packs, over a denominator of 700.
const evoTokenTable = slotTable(
	"Bright Lights' second Token slot",
	// One of the published 1.8 Tokens is the guaranteed slot before this.
	[{ rarity: "token", perPack: PUBLISHED_RATES.EVO.token - 1 }],
	"common",
);
const evoPremiumTable = slotTable(
	"Bright Lights' Premium Foil slot",
	[{ rarity: "legendary", perPack: PUBLISHED_RATES.EVO.premiumLegendary }],
	"common",
);

const BRIGHT_LIGHTS: PackConfig = {
	id: "EVO",
	cardsPerPack: 16,
	slots: [
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: evoRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: evoPremiumTable,
		},
		{ kind: "token", count: 1, rarityTable: [{ rarity: "token", weight: 1 }] },
		{
			kind: "token-or-wildcard",
			count: 1,
			rarityTable: evoTokenTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.EVO.coldFoil,
	coldFoilReplaces: "token",
	marvelChance: PUBLISHED_RATES.EVO.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.EVO.marvel),
};

// ---------------------------------------------------------------------------
// High Seas (SEA) — 16 cards. Rates from https://fabtcg.com/collectors-centre/high-seas/
// The block under "Premium Foil (1 per pack)" sums to 1.04, so it is that one slot's
// own rarity table, not extra pack-wide rates: Legendary and Marvel are premium-slot
// outcomes only. Normalising it costs each premium rate about 4%.
//
// Base Majestic is pinned at 1 per 4 in total; expansion-slot printings come out of
// that (split 0.20 / 0.05 here, ours), which keeps them pullable. Base Rare lands at
// 1.80 against a published 1.83, left alone.
// ---------------------------------------------------------------------------
const seaRareOrMajesticTable = slotTable(
	"High Seas' Rare-or-Majestic slot",
	[
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.SEA.majestic * (1 - EXPANSION_SHARE_OF_MAJESTIC),
		},
	],
	"rare",
);
// Weights are the published premium rates over a common denominator of
// 1440 packs: 1/96, 1/18, 5/24, 18/24, 1/60.
const seaWildcardTable = slotTable(
	"High Seas' Basic wildcard slot",
	[
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.SEA.majestic * EXPANSION_SHARE_OF_MAJESTIC,
			expansionSlot: true,
		},
	],
	"basic",
);
const seaPremiumTable = slotTable(
	"High Seas' Premium Foil slot",
	[
		{ rarity: "rare", perPack: PUBLISHED_RATES.SEA.premiumRare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.SEA.premiumMajestic },
		{ rarity: "marvel", perPack: PUBLISHED_RATES.SEA.premiumMarvel },
		{ rarity: "legendary", perPack: PUBLISHED_RATES.SEA.premiumLegendary },
	],
	"common",
);

const HIGH_SEAS: PackConfig = {
	id: "SEA",
	cardsPerPack: 16,
	slots: [
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: seaRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: seaPremiumTable,
		},
		{ kind: "basic", count: 1, rarityTable: [{ rarity: "basic", weight: 1 }] },
		{
			kind: "basic-or-wildcard",
			count: 1,
			rarityTable: seaWildcardTable,
		},
	],
	// No Cold Foil line anywhere on this set's page, unlike every other
	// same-era set. Modelled as 0 to match what is actually published
	// rather than assuming the family default.
	coldFoilChance: PUBLISHED_RATES.SEA.coldFoil,
	// Marvel is published as a Premium Foil outcome above, so it is drawn
	// from that slot's table rather than rolled separately.
	marvelChance: 0,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.SEA.premiumMarvel),
};

// ---------------------------------------------------------------------------
// Compendium of Rathe (PEN) — 9 cards. fabtcg.com/products/booster-set/
// compendium-of-rathe/ (the-fab-cube has no usable product_page for this set).
// "Cold Foil - 1 per 8 packs (replaces a Rare); Rainbow Foil - 1 per pack; Rare or
// higher - 3 per pack (2 Rare + 1 Rare, Majestic, Legendary, or Marvel); Common - 5".
// Rainbow Foil is a separate card: 3 + 5 = 8 is one short of 9.
//
// Rates from the Collectors Centre page (read by hand; it renders behind JS tabs).
// Two guaranteed Rares leave 0.55 Rare for the third slot, which also carries all
// Majestic and Legendary. Cold Foil lists only Majestic and Rare; it targets the
// third slot, which is Rare or Majestic about 87% of the time.
// ---------------------------------------------------------------------------
const penRareOrHigherWildcardTable = slotTable(
	"Compendium of Rathe's third Rare-or-higher slot",
	[
		// Two of the published 2.55 Rares are guaranteed slots before this.
		{ rarity: "rare", perPack: PUBLISHED_RATES.PEN.rare - 2 },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.PEN.majestic },
		{ rarity: "legendary", perPack: PUBLISHED_RATES.PEN.legendary },
	],
	"common",
);
const penPremiumTable = slotTable(
	"Compendium of Rathe's Premium Foil slot",
	[
		{ rarity: "rare", perPack: PUBLISHED_RATES.PEN.premiumRare },
		{ rarity: "majestic", perPack: PUBLISHED_RATES.PEN.premiumMajestic },
	],
	"common",
);

const COMPENDIUM_OF_RATHE: PackConfig = {
	id: "PEN",
	cardsPerPack: 9,
	slots: [
		{
			kind: "common",
			count: 5,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 2, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-super-rare-plus",
			count: 1,
			rarityTable: penRareOrHigherWildcardTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: penPremiumTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES.PEN.coldFoil,
	coldFoilReplaces: "rare-or-super-rare-plus",
	// Published as 1 per 96 packs.
	marvelChance: PUBLISHED_RATES.PEN.marvel,
	// Compendium of Rathe prints no Fabled card at all, so there is
	// nothing for a Fabled roll to resolve to.
	fabledChance: 0,
};

// ---------------------------------------------------------------------------
// Outsiders (OUT) — 16 cards. fabtcg.com/products/booster-set/outsiders/ prints a
// range ("Rare or higher - 1-2; Common - 11-12; Token - 2"); the Collectors Centre
// page gives the averages behind it: https://fabtcg.com/en/collectors-centre/outsiders/
// Real population: rare 51, majestic 34, legendary 5, marvel 3, token 20.
//
// Legendary is quoted as the Rainbow Foil rate, so it is reachable only via the
// premium slot. The second Rare-or-higher slot carries the remaining 0.75 Rare and
// all the Majestic, a clean 4:1 split.
//
// The engine only supports a fixed card count per slot, so Token is a flat 2 and
// Common a flat 11. This overstates how often a pack has 2 Tokens against the
// published 1.75 (the second token slot lands on Common an eighth of the time).
// ---------------------------------------------------------------------------
const outRareOrMajesticTable = slotTable(
	"Outsiders' Rare-or-Majestic slot",
	[{ rarity: "majestic", perPack: PUBLISHED_RATES.OUT.majestic }],
	"rare",
);
const outTokenTable = slotTable(
	"Outsiders' two Token slots",
	[{ rarity: "token", perPack: PUBLISHED_RATES.OUT.token }],
	"common",
	2,
);
const outPremiumTable = slotTable(
	"Outsiders' Premium Foil slot",
	[{ rarity: "legendary", perPack: PUBLISHED_RATES.OUT.premiumLegendary }],
	"common",
);

const OUTSIDERS: PackConfig = {
	id: "OUT",
	cardsPerPack: 16,
	slots: [
		{
			kind: "common",
			count: 11,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: outRareOrMajesticTable,
		},
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: outPremiumTable,
		},
		{ kind: "token", count: 2, rarityTable: outTokenTable },
	],
	coldFoilChance: PUBLISHED_RATES.OUT.coldFoil,
	coldFoilReplaces: "token",
	// The Collectors Centre page prints "1 per ??? packs", but LSS has
	// since published Outsiders's Marvel rate as 1 per 390 packs.
	marvelChance: PUBLISHED_RATES.OUT.marvel,
	fabledChance: fabledChanceFor(PUBLISHED_RATES.OUT.marvel),
};

// ---------------------------------------------------------------------------
// History Pack 1 (1HP) — 10 cards.
// fabtcg.com/products/booster-set/history-pack-1-en/: "Rare or higher - 1; Rare - 1;
// Common - 8". No Token, Premium Foil or Cold Foil slot (a reprint-focused product).
// Real population: common 238, rare 118, majestic 62, legendary 9.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/history-pack-1/. Fabled and
// Marvel are Black Label only, so marvelChance stays 0. Rare 1.65 is the guaranteed
// Rare plus 0.65 from the second slot, with Common taking the last 2%.
const hpRareOrHigherTable = slotTable(
	"History Pack 1's second Rare-or-higher slot",
	[
		// One of the two published Rares is the guaranteed slot before this.
		{ rarity: "rare", perPack: PUBLISHED_RATES["1HP"].rare - 1 },
		{ rarity: "majestic", perPack: PUBLISHED_RATES["1HP"].majestic },
		{ rarity: "legendary", perPack: PUBLISHED_RATES["1HP"].legendary },
	],
	"common",
);

const HISTORY_PACK_1: PackConfig = {
	id: "1HP",
	cardsPerPack: 10,
	slots: [
		{
			kind: "common",
			count: 8,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: hpRareOrHigherTable,
		},
	],
	coldFoilChance: PUBLISHED_RATES["1HP"].coldFoil,
	marvelChance: PUBLISHED_RATES["1HP"].marvel,
	// History Pack 1's three Fabled cards are Black Label
	// product, not boosters, so there is nothing for a Fabled roll
	// to resolve to.
	fabledChance: 0,
};

// ---------------------------------------------------------------------------
// Mastery Pack Guardian (MPG) — 13 cards. Product page (no rates), see
// published-rates.ts's MPG block:
//   Common 9 / Rare or Majestic 1 / Equipment 1 / Token 1 /
//   "Token or higher, Rainbow Foil or Cold Foil" 1
//
// Weighted by population. The last slot is the premium card: Common-primary with a
// Legendary sliver; Marvel rides on it as the cold-foil upgrade (all its Marvels are
// Cold Foil). Equipment is Common or Rare only: Legendary Equipment is left to the
// premium slot, since population-weighting it here would deal it about 1 pack in 10.
// No Fabled printing.
// ---------------------------------------------------------------------------
const mpgRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: PUBLISHED_RATES.MPG.popRare },
	{ rarity: "majestic" as const, weight: PUBLISHED_RATES.MPG.popMajestic },
];
const mpgEquipmentTable = [
	{
		rarity: "common" as const,
		weight: PUBLISHED_RATES.MPG.popEquipmentCommon,
		requiresType: "Equipment",
	},
	{
		rarity: "rare" as const,
		weight: PUBLISHED_RATES.MPG.popEquipmentRare,
		requiresType: "Equipment",
	},
];
const mpgPremiumTable = slotTable(
	"Mastery Pack Guardian's Premium Foil slot",
	[{ rarity: "legendary", perPack: PUBLISHED_RATES.MPG.premiumLegendary }],
	"common",
);

const MASTERY_PACK_GUARDIAN: PackConfig = {
	id: "MPG",
	cardsPerPack: 13,
	slots: [
		{
			kind: "common",
			count: 9,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{
			kind: "rare-or-majestic",
			count: 1,
			rarityTable: mpgRareOrMajesticTable,
		},
		{ kind: "equipment", count: 1, rarityTable: mpgEquipmentTable },
		{ kind: "token", count: 1, rarityTable: [{ rarity: "token", weight: 1 }] },
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: mpgPremiumTable,
		},
	],
	// No published rate; the slot only says the premium card may be Cold
	// Foil. Takes the one-per-display default every other set confirms.
	coldFoilChance: PUBLISHED_RATES.MPG.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: PUBLISHED_RATES.MPG.marvel,
	// This set prints no Fabled card.
	fabledChance: 0,
};

// ---------------------------------------------------------------------------
// GEM Packs (GEM1 to GEM5) — free prize support at Armory events. Configuration
// from https://fabtcg.com/articles/gem_pack_faq/ :
//   "3 cards per pack: 1 regular print, 1 premium foil (Rainbow Foil, Cold
//   Foil or Marvel), 1 art card"
//
// Five products under one the-fab-cube set code; scripts/build-pack-data.ts splits
// them (SET_SPLITS), and each is stamped out below.
//
// Every printing is Promo, so slots differ by FOILING rather than rarity (hence the
// "promo" slot kind). They deal TWO cards: the art card is not in the data, so it
// is left out. marvelChance is 0 because its Marvel-treatment promos are Promo
// rarity with Cold Foil, which the cold-foil roll already covers.
// ---------------------------------------------------------------------------
const gemPromoTable = [{ rarity: "promo" as const, weight: 1 }];

function gemPack(
	id: string,
	population: { popCold: number; popRainbow: number },
): PackConfig {
	return {
		id,
		cardsPerPack: 2,
		slots: [
			{ kind: "promo", count: 1, rarityTable: gemPromoTable },
			{
				kind: "premium-foil",
				count: 1,
				fixedTreatment: "rainbow",
				rarityTable: gemPromoTable,
			},
		],
		// How often the premium card is Cold Foil instead of Rainbow, as this
		// pack's own Cold-to-Rainbow printing ratio. A population share
		// standing in for a pull rate LSS does not publish.
		coldFoilChance:
			population.popCold / (population.popCold + population.popRainbow),
		coldFoilReplaces: "premium-foil",
		// No Marvel-rarity or Fabled printing exists in this line.
		marvelChance: 0,
		fabledChance: 0,
	};
}

// ---------------------------------------------------------------------------
// Mastery Pack Warrior (MPW) — 13 cards. Product page (no rates), see
// published-rates.ts's MPW block:
//   Common 8 / Rare 1 / Rare or Majestic 1 / Rainbow Foil 1 /
//   Basic 1 / "Basic, Legendary, Cold Foil, or Marvel" 1
//
// Unlike Guardian, it deals two Basics and hangs Legendary, Marvel and Cold Foil off
// the second, so the two configs are written out separately. Legendary is left out
// of the Rainbow Foil slot because LSS lists it under the Basic slot. Marvel sits in
// the Basic slot's own table (generate-pack forces any Marvel to Cold Foil). No
// Fabled and no Token card.
// ---------------------------------------------------------------------------
const mpwRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: PUBLISHED_RATES.MPW.popRare },
	{ rarity: "majestic" as const, weight: PUBLISHED_RATES.MPW.popMajestic },
];
const mpwRainbowTable = [
	{ rarity: "common" as const, weight: PUBLISHED_RATES.MPW.popRainbowCommon },
	{ rarity: "rare" as const, weight: PUBLISHED_RATES.MPW.popRainbowRare },
	{
		rarity: "majestic" as const,
		weight: PUBLISHED_RATES.MPW.popRainbowMajestic,
	},
];
const mpwBasicWildcardTable = slotTable(
	"Mastery Pack Warrior's Basic / Legendary / Marvel slot",
	[
		{ rarity: "legendary", perPack: PUBLISHED_RATES.MPW.legendary },
		{ rarity: "marvel", perPack: PUBLISHED_RATES.MPW.marvel },
	],
	"basic",
);

const MASTERY_PACK_WARRIOR: PackConfig = {
	id: "MPW",
	cardsPerPack: 13,
	slots: [
		{
			kind: "common",
			count: 8,
			rarityTable: [{ rarity: "common", weight: 1 }],
		},
		{ kind: "rare", count: 1, rarityTable: [{ rarity: "rare", weight: 1 }] },
		{ kind: "rare-or-majestic", count: 1, rarityTable: mpwRareOrMajesticTable },
		{
			kind: "premium-foil",
			count: 1,
			fixedTreatment: "rainbow",
			rarityTable: mpwRainbowTable,
		},
		{ kind: "basic", count: 1, rarityTable: [{ rarity: "basic", weight: 1 }] },
		{
			kind: "basic-or-wildcard",
			count: 1,
			rarityTable: mpwBasicWildcardTable,
		},
	],
	// Cold Foil is published as an outcome of the Basic wildcard slot, not
	// of the Rainbow Foil one, so that is the card it upgrades. No rate is
	// published for it; takes the same one-per-display default as Guardian.
	coldFoilChance: PUBLISHED_RATES.MPW.coldFoil,
	coldFoilReplaces: "basic-or-wildcard",
	// Marvel is an entry in the wildcard slot's own table above, which is
	// where the product page puts it, so nothing rides on marvelChance.
	marvelChance: 0,
	// This set prints no Fabled card.
	fabledChance: 0,
};

/** Legendary's weight in the Antiquity slot: a 10-card pool filed as 6 Common and
 * 4 Rare, so the published 1 in 20 share needs w / (10 + w) = 1/20, i.e. 10/19. */
const ANQ_LEGENDARY_WEIGHT = 10 / 19;

/** Compendium of Rathe - Antiquity Pack: the 3-card bonus pack, opened here as TWO cards.
 *
 * The third card is a puzzle piece; the 27 puzzle cards are in no dataset we build
 * from, so that slot is left out. See published-rates.ts's ANQ block.
 *
 * The Antiquity slot is `premium-foil` because generate-pack.ts applies
 * fabledChance and marvelChance to that slot kind. It has no fixedTreatment: the
 * pack-level Cold Foil roll produces the published 7 per 8 regular / 1 per 8 Cold Foil. */
const ANTIQUITY_PACK: PackConfig = {
	id: "ANQ",
	cardsPerPack: 2,
	slots: [
		{
			kind: "premium-foil",
			count: 1,
			rarityTable: [{ rarity: "majestic", weight: 1 }],
		},
		{
			// POPULATION: LSS gives one 10-card "Rare" slot with no split, so each of the 10 is
			// equally likely; upstream files them as 6 Common and 4 Rare.
			kind: "rare",
			count: 1,
			rarityTable: [
				{ rarity: "common", weight: 6 },
				{ rarity: "rare", weight: 4 },
				{ rarity: "legendary", weight: ANQ_LEGENDARY_WEIGHT },
			],
		},
	],
	coldFoilChance: PUBLISHED_RATES.ANQ.coldFoil,
	coldFoilReplaces: "premium-foil",
	fabledChance: PUBLISHED_RATES.ANQ.fabled,
	marvelChance: PUBLISHED_RATES.ANQ.marvel,
};

export const REAL_SET_PACK_CONFIGS: Record<string, PackConfig> = {
	ANQ: ANTIQUITY_PACK,
	GEM1: gemPack("GEM1", PUBLISHED_RATES.GEM1),
	GEM2: gemPack("GEM2", PUBLISHED_RATES.GEM2),
	GEM3: gemPack("GEM3", PUBLISHED_RATES.GEM3),
	GEM4: gemPack("GEM4", PUBLISHED_RATES.GEM4),
	GEM5: gemPack("GEM5", PUBLISHED_RATES.GEM5),
	MPG: MASTERY_PACK_GUARDIAN,
	MPW: MASTERY_PACK_WARRIOR,
	EVR: EVERFEST,
	UPR: UPRISING,
	DYN: DYNASTY,
	DTD: DUSK_TILL_DAWN,
	HVY: HEAVY_HITTERS,
	MST: PART_THE_MISTVEIL,
	ROS: ROSETTA,
	HNT: THE_HUNTED,
	SUP: SUPER_SLAM,
	OMN: OMENS_OF_THE_THIRD_AGE,
	IAR: USURP_THE_SHADOW_THRONE,
	WTR: WELCOME_TO_RATHE,
	ARC: ARCANE_RISING,
	CRU: CRUCIBLE_OF_WAR,
	MON: MONARCH,
	ELE: TALES_OF_ARIA,
	EVO: BRIGHT_LIGHTS,
	SEA: HIGH_SEAS,
	PEN: COMPENDIUM_OF_RATHE,
	OUT: OUTSIDERS,
	"1HP": HISTORY_PACK_1,
};

/** The live fabtcg.com page each config was sourced from. Read only by the set info dialog. */
export const SET_SOURCE_URLS: Record<string, string> = {
	ANQ: "https://cardvault.fabtcg.com/products/compendium-of-rathe-antiquity-pack",
	EVR: "https://fabtcg.com/products/booster-set/everfest/",
	UPR: "https://fabtcg.com/products/booster-set/uprising/",
	DYN: "https://fabtcg.com/products/booster-set/dynasty/",
	DTD: "https://fabtcg.com/en/products/booster-set/dusk-till-dawn/",
	HVY: "https://fabtcg.com/products/booster-set/heavy-hitters/",
	MST: "https://fabtcg.com/products/booster-set/part-the-mistveil/",
	ROS: "https://fabtcg.com/products/product/rosetta/",
	HNT: "https://fabtcg.com/products/product/the-hunted/",
	SUP: "https://fabtcg.com/en/products/booster-set/super-slam/",
	OMN: "https://fabtcg.com/products/booster-set/omen/",
	IAR: "https://fabtcg.com/products/booster-set/iar/",
	WTR: "https://fabtcg.com/products/booster-set/welcome-to-rathe/",
	ARC: "https://fabtcg.com/products/booster-set/arcane-rising/",
	CRU: "https://fabtcg.com/products/booster-set/crucible-of-war/",
	MON: "https://fabtcg.com/products/booster-set/monarch-unlimited/",
	ELE: "https://fabtcg.com/products/booster-set/tales-of-aria/",
	EVO: "https://fabtcg.com/products/booster-set/bright-lights/",
	SEA: "https://fabtcg.com/products/booster-set/high-seas/",
	PEN: "https://fabtcg.com/products/booster-set/compendium-of-rathe/",
	OUT: "https://fabtcg.com/products/booster-set/outsiders/",
	"1HP": "https://fabtcg.com/products/booster-set/history-pack-1-en/",
};
