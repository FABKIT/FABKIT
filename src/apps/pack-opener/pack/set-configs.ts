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
 * Real per-set pack configs, verified against each set's own official
 * fabtcg.com product page (fetched directly, browser user-agent — see the
 * execution plan's Appendix A.1) and sanity-checked against that set's real
 * printed card population (scripts/build-pack-data.ts's output). Only sets
 * whose official page states a slot structure that sums to a *confirmed*
 * pack size are here — see the execution plan, section 10, for the sets
 * still waiting on a product-owner decision (Outsiders' stated ranges,
 * High Seas' assumed-by-family size, Compendium of Rathe's missing page,
 * and every set whose page gives frequencies instead of slots, which need
 * the section 5.2.1 derivation method plus a calibration test instead of
 * being listed here).
 *
 * A rarity table's weights are that set's own real per-rarity printing
 * count (see the counts cited in each config's comment) used directly as
 * weights, wherever LSS's own page states a slot's *membership*
 * ("1 Rare or Majestic") without stating the internal split between those
 * rarities — LSS does not publish that split for any of these sets. This
 * is a documented approximation, not a sourced pull-weight: it assumes a
 * card's rarity is pulled roughly in proportion to how many distinct cards
 * of that rarity exist in the set, which is a reasonable prior but not
 * something LSS has confirmed. Where a rarity isn't mentioned by name in a
 * slot's own text but its cards still exist somewhere in the set (e.g. a
 * "Rare or Majestic" slot's set also prints Legendary cards), it's folded
 * into that set's *premium* (guaranteed-foil) slot instead, on the
 * reasoning that the premium/hit slot is where a set's higher rarities are
 * conventionally concentrated — also unconfirmed, flagged per-config below.
 *
 * "Basic / Expansion Slot / Marvel / Legendary"-style wildcard slots:
 * where a set's real data has zero non-expansion-slot Basic printings
 * (Heavy Hitters, Part the Mistveil, Rosetta, The Hunted all do — see each
 * config below), Basic is omitted from that slot's table entirely rather
 * than left in with a weight pointing at an empty pool, which would fail
 * pool-viability. This is a real gap between what LSS's page lists and
 * what the-fab-cube's per-set data actually contains — flagged here rather
 * than papered over with a substitution.
 *
 * "X or Expansion Slot" outcomes: modelled as one additional rarityTable
 * entry with `expansionSlot: true`, using Majestic as the representative
 * rarity (see pack/types.ts's RarityWeight comment) — it's the dominant
 * rarity among every checked set's own expansion-slot pool.
 *
 * A cold-foil rate stated as "1 per display" is converted to 1/24, since
 * every set here confirms (via its own barcode/product-configuration text)
 * that a display is 24 packs — more precise than DEFAULT_COLD_FOIL_CHANCE's
 * general 1/22 community estimate, which is kept only for the mock config.
 */
export const PUBLISHED_COLD_FOIL_CHANCE = COLD_FOIL_PER_DISPLAY;

// ---------------------------------------------------------------------------
// Everfest (EVR) — 10 cards. fabtcg.com/products/booster-set/everfest/
// "A booster pack contains 10 cards, being: Premium Foil - 1 per pack
// (Rainbow Foil or Cold Foil); Rare or higher - 2 per pack (1 Rare/
// Majestic/Legendary); Common - 7 per pack." Sum: 1 + 2 + 7 = 10.
// Real population (non-expansion-slot, distinct cards): rare 61, majestic
// 45, legendary 3. No Basic, Token, Marvel, or Fabled printings exist in
// this set at all, so none of those are reachable here — marvelChance is 0
// to match (a nonzero value would draw from an empty pool).
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/everfest/ :
//   1 Fabled (1 per ??? packs) / 3 Legendary (1 per 160 packs) /
//   45 Majestic (1 per 4 packs) / 61 Rare (1.65 per pack) /
//   88 Common (7 per pack) / Rainbow Foil (1 per pack) /
//   Cold Foil (1 per 16 packs)
// Those sum to 9.91, i.e. the 10-card pack, once the Premium Foil card is
// counted as the Common it usually is: the published "7 per pack" Common
// rate has to be the seven non-foil ones for the arithmetic to close.
// The two Rare-or-higher slots therefore carry the whole of Rare 1.65,
// Majestic 1 per 4 and Legendary 1 per 160 between them. Weights below are
// those rates halved over a denominator of 2000 draws, with Common taking
// up the small slack the published rounding leaves.
// Fabled is omitted: its rate is printed "1 per ??? packs".
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
	// The page states the premium slot itself is "Rainbow Foil or Cold
	// Foil" with no ratio — there's no separate token/basic slot for it to
	// replace, unlike every other set here. coldFoilReplaces targets the
	// premium slot directly, which the engine handles regardless of that
	// slot's existing fixedTreatment (see generate-pack.ts).
	// Published as "Cold Foil (1 per 16 packs)" on this set's Collectors
	// Centre page: the one set here that is not the 1-per-display 1/24.
	coldFoilChance: PUBLISHED_RATES.EVR.coldFoil,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
	fabledChance: fabledChanceFor(0),
};

// ---------------------------------------------------------------------------
// Uprising (UPR) — 16 cards. fabtcg.com/products/booster-set/uprising/
// "A booster pack contains 16 cards, being: Rainbow Foil - 1 per pack;
// Rare or higher - 2 per pack (1 Rare + 1 Rare/Majestic); Common - 11 per
// pack; Token - 2 per pack; Cold Foil - 1 per display." Sum: 1 + 2 + 11 + 2
// = 16 (Rainbow Foil is its own card here, not folded into the pair — see
// set-configs.ts's file comment; confirmed by the sum only working out
// this way).
// Real population: rare 51, majestic 27, legendary 6, token 16, marvel 16.
// The page never mentions Legendary or Marvel by name. Legendary is folded
// into the premium slot (see file comment); Marvel is applied via
// marvelChance on that same slot, matching every other set here whose page
// is silent on Marvel but whose pool has real Marvel printings.
// The page doesn't state what Cold Foil replaces (unlike the newer sets'
// "(replaces a token)" wording) — targeting the Token slot is an inference
// by analogy with every later set that does state it, not sourced text.
//
// The named pair ("1 Rare + 1 Rare/Majestic") already accounts for this
// set's Rare and Majestic pulls on its own; giving the separate Premium
// Foil slot the same weighted table on top would double-count them (this
// is exactly the bug the Welcome to Rathe/Crucible of War/Monarch/Tales
// of Aria configs' calibration tests caught — see set-configs.ts's WTR
// comment). There's no published aggregate rate for this set to calibrate
// against, but the same reasoning still applies: Premium Foil is modelled
// as Common-primary instead, keeping only a population-weighted sliver of
// Legendary so that rarity stays reachable (it has no other channel in
// this set, unlike sets with a dedicated wildcard/Equipment slot).
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/uprising/ :
//   1 Fabled (1 per ??? packs) /
//   6 Legendary (Rainbow Foil 1 per 80 packs, Cold Foil 1 per 220) /
//   27 Majestic (1 per 4 packs) / 51 Rare (1.75 per pack) /
//   125 Common (11 per pack) / 16 Tokens (1.75 per pack) /
//   Premium Foil (1 per pack) / Cold Foil (1 per 24 packs) /
//   Marvel (1 per ??? packs)
// Sum: 15.77, i.e. the 16-card pack. Rare 1.75 is one guaranteed Rare plus
// 0.75 from the pair's second half; Majestic 1 per 4 is the rest of it,
// split 4:1 with the expansion-slot entry. Legendary keeps its premium-slot
// channel but now at the published Rainbow Foil rate of 1 per 80 rather
// than a population sliver. The two token slots share the published 1.75,
// so each lands on a token 87.5% of the time.
// Unlike the later sets, this one prints no expansion-slot Majestic at
// all in the-fab-cube's data (tests/pack-opener/pool-viability.test.ts
// catches it), so the published Majestic rate stays whole rather than
// being split with an expansion entry.
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
// "A booster pack contains 10 cards, being: Premium Foil - 1 per pack;
// Rare or higher - 2 per pack (1 Rare + 1 Rare/Majestic); Common - 7 per
// pack." Sum: 1 + 2 + 7 = 10. No Cold Foil line at all on this page —
// coldFoilChance is 0 to match (nothing published, unlike every other set
// here).
// Real population: rare 81, majestic 51, legendary 5, marvel 14. Legendary
// folded into the premium slot; Marvel applied via marvelChance there too
// (page is silent on both, same reasoning as Uprising above).
// Premium Foil modelled as Common-primary with a population-weighted
// sliver of Legendary, not a reuse of the named pair's own table — same
// double-counting fix as Uprising above.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/dynasty/ :
//   1 Fabled (1 per ??? packs) / 14 Marvel (1 per ??? packs) /
//   5 Legendary (Rainbow Foil 1:88, Cold Foil 1:280) / 51 Majestic (1:4) /
//   81 Rare (1.75 per pack) / 109 Common (7 per pack) /
//   Cold Foil (1:24) / Premium Foil (1 per pack)
// Sum: 10.01, i.e. the 10-card pack. Same derivation as Uprising above.
// Unlike the later sets, this one prints no expansion-slot Majestic at
// all in the-fab-cube's data (tests/pack-opener/pool-viability.test.ts
// catches it), so the published Majestic rate stays whole rather than
// being split with an expansion entry.
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
// Dusk till Dawn (DTD) — 10 cards.
// fabtcg.com/en/products/booster-set/dusk-till-dawn/
// "A booster pack contains 10 cards, being: Cold Foil - 1 per display
// (replaces a Rare); Rainbow Foil - 1 per pack; Rare or higher - 2 per
// pack (1 Rare + 1 Rare or Majestic); Common - 7 per pack." Sum: 1 + 2 + 7
// = 10 (Rainbow Foil is separate here too — see file comment).
// Real population: rare 77, majestic 56, legendary 8, marvel 10.
// Premium Foil modelled as Common-primary with a population-weighted
// sliver of Legendary, not a reuse of the named pair's own table — same
// double-counting fix as Uprising/Dynasty above.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/dusk-till-dawn/ :
//   1 Fabled (1 per ??? packs) / 8 Legendary (1 per 64 packs) /
//   56 Majestic (1 per 4 packs) / 77 Rare (1.68 per pack) /
//   94 Common (7 per pack) / Premium Foil (1 per pack) /
//   Cold Foil (1 per 24 packs) / 10 Marvels (1 per ??? packs)
// Sum: 9.95, i.e. the 10-card pack. Rare 1.68 is one guaranteed plus 0.68
// from the pair's second half; Common takes the 0.07 of slack left over.
// Unlike the later sets, this one prints no expansion-slot Majestic at
// all in the-fab-cube's data (tests/pack-opener/pool-viability.test.ts
// catches it), so the published Majestic rate stays whole rather than
// being split with an expansion entry.
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
// Heavy Hitters / Part the Mistveil / Rosetta / The Hunted family — 16
// cards each. All four now come straight from their Collectors Centre
// pages (transcribed in docs/pull-rate-verification.md), which publish
// per-pack rates rather than the slot memberships the product pages give.
// They share one shape: a base block, then a "Premium Foil (1 per pack)"
// block, then a Cold Foil block.
//
// Heavy Hitters is the worked example. Its base block reads
//   Majestic 1 per 4 packs / Rare 1.83 per pack /
//   Common 11 per pack / Token 1.85 per pack
// and those sum to 14.93, which plus the one Premium Foil card is 15.93.
// A 16-card pack, accounted for exactly, with no Basic in it at all — so
// the product page's "Basic / Expansion Slot / Marvel / Legendary" wildcard
// is not a Basic slot in practice, and this family no longer models one.
//
// The Premium Foil block is that single card's own rarity table:
//   Legendary 1 per 96 / Majestic 1 per 18 / Rare 5 per 24 / Common 18 per 24
// Those sum to 1.02, which is what tells you it describes one card rather
// than another set of pack-wide rates. Legendary appears there and nowhere
// else with a rate, so Legendary is drawn there and only there. Normalising
// the 1.02 away costs each premium rate about 2%.
//
// The remaining four slots carry Rare 1.83, Majestic 0.25 and Token
// (1.85, 1.84, 1.54, 1.54 — the one number that differs between the four
// sets) as: a guaranteed Rare, a Rare-or-Majestic, a guaranteed Token, and
// a Token-or-Common that takes up whatever slack the set's token rate
// leaves. Common absorbs it because it is the only rarity in the block
// whose published rate is a round number and therefore visibly rounded;
// Rosetta's separate "36 Puzzle (6 per 24 packs)" insert lands here too,
// having no rarity of its own in the-fab-cube's data.
//
// Expansion-slot content: LSS publishes no rate for it, but its printings
// are Majestic rarity, so they come OUT of the published 1-per-4 Majestic
// rate rather than on top of it. A fifth of that rate is routed to an
// expansion entry, which keeps those cards pullable without inventing a
// number the published total does not already pin down.
//
// Marvel is published for two of the four (Heavy Hitters 1 per 192, Part
// the Mistveil 1 per 100) and printed as "1 per ??? packs" for Rosetta and
// The Hunted, which take ESTIMATED_MARVEL_CHANCE instead. Every Marvel is
// a Cold Foil card, which is why it is rolled onto the premium slot rather
// than sitting in a rarity table (see pack/generate-pack.ts).
// ---------------------------------------------------------------------------

/** The Premium Foil slot's published rarity table, shared by all four sets
 * because all four publish exactly the same one: 1/96, 1/18, 5/24, 18/24
 * over a common denominator of 1440 packs. Fabled is omitted — every page
 * prints "1 per ??? packs" for it, and an invented rate is worse than an
 * unpullable card. */
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
// Super Slam (SUP) — 15 cards.
// fabtcg.com/en/products/booster-set/super-slam/, "Rarity Distribution":
// Cold Foil - 1 per 24 packs (replaces a Basic); Rainbow Foil - 1 per
// pack; Rare or higher - 2 per pack (1 Rare + 1 Rare, Super Rare, or
// Majestic); Common - 11 per pack; Basic / Expansion Slot / Legendary /
// Marvel - 1 per pack. Sum: 11 + 2 + 1 (separate Rainbow Foil card) + 1 =
// 15 — unlike the family above, this only reaches 15 if Rainbow Foil is
// its own card (matches the plan's own sum check for this set too).
// Real population: rare 40, superrare 40, majestic 14, legendary 2, basic
// 9, marvel 8 (marvel/legendary counts exclude their own expansion-slot
// printings, consistent with every other config here).
// Premium Foil modelled as Common only, not a reuse of the named pair's
// own table — the same double-counting fix as Uprising/Dynasty/Dusk till
// Dawn above, except here Legendary already has its own channel (the
// wildcard slot below), so there's no need to keep a sliver of it in
// Premium Foil too.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/super-slam/ . Base:
//   14 Set (1 per 8 packs) / 24 Expansion (1 per 6 packs) /
//   40 Super Rare (1 per 2.18 packs) / 40 Rare (1.42 per pack) /
//   134 Common (11 per pack) / 1 Premium Foil (1 per pack)
//   (1 Fabled, 5 Legendary, 42 Majestic and 14 Basic carry no base rate)
// Then "1 Premium Foil (1 per pack)" with its own breakdown:
//   1 Fabled (1 per ??? packs) / 5 Legendary (1 per 94 packs) /
//   21 Majestic (1 per 22 packs) / 36 Super Rare (1 per 13 packs) /
//   39 Rare (4 per 24 packs) / 111 Common (17 per 24 packs)
//   / 47 Cold Foil (1 per 24 packs)
// That second block sums to 1.01, which is what marks it as one card's
// distribution rather than more pack-wide rates - same reading as High
// Seas below. Legendary is published there and nowhere else, so it is
// drawn there and only there, at 1 per 94.
//
// Set and Expansion content (0.125 + 0.167 a pack) is expansion-slot
// printings, modelled at Majestic rarity per pack/types.ts. It is split
// between the Rare-or-higher slot and the wildcard; both published rates
// are honoured in total.
//
// This set's base Majestic has no published rate at all, only the premium
// slot's 1 per 22. The gap is filled from OBSERVED data rather than a
// published figure, and is the one number in this file that is: counting a
// display box gives about 10 Majestics per 24 packs, i.e. 0.417 a pack in
// total. The published Set (1 per 8) and Expansion (1 per 6) content plus
// the premium slot's 1 per 22 account for 0.337 of that, so the wildcard
// slot carries the remaining 0.08 as ordinary Majestic. Basic gives up the
// weight for it, Basic being the one rarity here with no published rate.
const supRareOrHigherTable = slotTable(
	"Super Slam's Rare-or-higher slot",
	[
		{ rarity: "superrare", perPack: PUBLISHED_RATES.SUP.superRare },
		// The published "Set" content, as distinct from the "Expansion"
		// content, which rides in the wildcard slot below.
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.SUP.set,
			expansionSlot: true,
		},
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
// Omens of the Third Age (OMN) — 16 cards. omen.fabtcg.com, "Rarity
// Distribution": Cold Foil - 1 per 24 packs (replaces a Basic); Common -
// 11 per pack; Rare or Majestic - 2 per pack (1 Rare + 1 Rare or
// Majestic); Rainbow Foil - 1 per pack; Basic - 2 per pack (1 Basic + 1
// Basic, Expansion Slot, Legendary, Marvel, or Fabled). Sum: 11 + 2 + 1
// (separate Rainbow Foil, same as Super Slam above) + 2 = 16.
//
// Rates, from this set's Collectors Centre breakdown (read off the live
// page by hand; it renders behind JavaScript tabs):
//   1 Fabled / 5 Legendary / 37 Majestic, being
//     15 Set (1 per 8 packs) and 22 Expansion (1 per 7 packs)
//   60 Rare (1.88 per pack) / 134 Common (11 per pack) /
//   14 Basic (1.8 per pack) / 1 Premium Foil (1 per pack), itself being
//     1 Fabled (1 per ???) / 5 Legendary (1 per 96) /
//     14 Majestic (1 per 42) / 59 Rare (5.5 per 24) / 105 Common (18 per 24)
//   Cold Foil (1 per 24 packs), being Fabled / Legendary / Majestic /
//   Common / 12 Marvel
// The premium block sums to 1.01, the usual tell that it describes one
// card. Base sum: 0.125 + 0.143 + 1.88 + 11 + 1.8 + 1 = 15.95, the 16-card
// pack.
//
// This set publishes no standalone Majestic rate: its Majestics are Set
// and Expansion content, both of which DO have rates, so its whole base
// Majestic figure is expansion-slot content (same shape as Super Slam).
// Those two rates total 0.268 a pack, which is more than the one
// Rare-or-Majestic slot can carry alongside 0.88 Rare, so the remainder
// rides in the Basic wildcard - which is where this set's own page says
// Expansion Slot content appears anyway.
//
// Marvel is listed in the Cold Foil block with no rate, so it takes the
// estimate.
// ---------------------------------------------------------------------------
const omnRareOrMajesticTable = slotTable(
	"Omens of the Third Age's Rare-or-Majestic slot",
	[
		// The published "Set" content; "Expansion" rides in the wildcard.
		{
			rarity: "majestic",
			perPack: PUBLISHED_RATES.OMN.set,
			expansionSlot: true,
		},
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
// Welcome to Rathe (WTR) — 16 cards.
// fabtcg.com/products/booster-set/welcome-to-rathe/ (the-fab-cube's own
// product_page URL for this set 404s — this is the live page, found by
// correcting the slug). Verbatim: "A booster pack contains 16 cards,
// being: 1 Token per pack; 4 Generic Commons; 7 Class Commons (a mix of
// Brute, Guardian, Ninja, Warrior); 1 Rare; 1 Rare / Super Rare / Majestic;
// 1 Equipment; 1 Premium Foil (can be from any non-token rarity)."
// Sum: 1 + 4 + 7 + 1 + 1 + 1 + 1 = 16.
//
// Legendary is notably absent from every named slot above. Checked against
// the real data: all 5 of this set's real Legendary printings are
// Equipment-type cards, and nothing else in the set is. The collectors-
// centre page (fabtcg.com/collectors-centre/welcome-to-rathe/) states
// Legendary at "1 per 96 packs" — since Equipment is the only channel that
// reaches Legendary at all, that published rate IS the Equipment slot's
// legendary weight: 1/96, with the remaining 95/96 landing on the set's 12
// Equipment-type Commons. This reproduces the published rate exactly
// rather than approximating it, and is checked by this set's calibration
// test.
//
// The "1 Rare / Super Rare / Majestic" slot is the *only* thing standing
// between the guaranteed pure Rare and the published aggregate rates
// (Rare 1.75/pack, Super Rare 1/6, Majestic 1/12) — 1(pure) + this slot's
// own rate must equal each of those. Working backwards: this slot's own
// rate needs to be Rare 0.75, Super Rare 1/6, Majestic 1/12, which sums to
// exactly 1 — confirmation this slot alone explains the whole published
// spread, with nothing left over for the Premium Foil slot to add.
// Weighted to whole numbers (x12): Rare 9, Super Rare 2, Majestic 1.
//
// That leaves the Premium Foil slot itself: "(can be from any non-token
// rarity)" reads like it could also be Rare/Super Rare/Majestic, but
// giving it any material chance of those would push the aggregate rate
// past what's published (checked directly — an earlier version of this
// config did exactly that, reusing this same table for Premium Foil, and
// its own calibration test caught the resulting ~1.5x overshoot). So
// Premium Foil is modelled as landing on Common in practice — still a
// non-token rarity, still meaningfully different from an ordinary common
// pull since it's guaranteed Rainbow Foil, just not itself a source of
// extra Rare/Super Rare/Majestic pulls on top of the two slots above.
//
// Cold Foil: collectors-centre states "1 per pack, with Alpha Print
// containing 1 Cold Foil every 24 packs" — modelled as a straight 1/24
// upgrade on the Premium Foil slot (the app doesn't distinguish Alpha
// from Unlimited print runs, so this technically over-applies to
// Unlimited packs too — a real simplification, not a sourced choice).
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
// Arcane Rising (ARC) — 16 cards. Identical published structure to Welcome
// to Rathe, including the same "1 per 96 packs" Legendary rate and the
// same all-Legendary-is-Equipment fact in the real data (verified
// separately for this set). fabtcg.com/products/booster-set/arcane-rising/.
// Cold Foil: "First Edition containing 1 Cold Foil every 24 packs."
// Real population: common 126, rare 48, super rare 15, majestic 10,
// legendary 5 (all Equipment), token 14. Same reasoning as Welcome to
// Rathe applies to the split between the "1 Rare/Super Rare/Majestic"
// slot and the Premium Foil slot — see that set's comment above.
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
// Crucible of War (CRU) — 10 cards.
// fabtcg.com/products/booster-set/crucible-of-war/. Verbatim: "A booster
// pack contains 10 cards, being: 7 Commons; 1 Rare; 1 Rare / Majestic /
// Legendary; 1 Premium Foil." Sum: 7 + 1 + 1 + 1 = 10. No Token slot at
// all for this set (confirmed — the real data has no Token printings for
// CRU either), and no Equipment slot (Equipment-type cards exist in the
// set but aren't a named slot here, unlike Welcome to Rathe/Arcane Rising).
//
// Unlike those two, Legendary IS named directly in a slot here ("Rare /
// Majestic / Legendary"), so the section 5.2.1 four-step method applies:
// collectors-centre states Rare 1.75/pack, Majestic 1/4 (0.25/pack),
// Legendary 1/240 (0.0041667/pack). Sum = 2.0042 -> 2 slots (1 pure Rare +
// 1 Rare/Majestic/Legendary), matching the published structure.
//
// The guaranteed pure Rare already contributes 1.0 of the 1.75 Rare
// total, so the "Rare/Majestic/Legendary" slot's own rate needs to be
// Rare 0.75, Majestic 0.25, Legendary 1/240 — which is (almost exactly)
// the whole published amount on its own. Scaled to whole numbers (x240):
// Rare 180, Majestic 60, Legendary 1 (of 241).
//
// That leaves nothing of substance for the Premium Foil slot to add
// without pushing the aggregate past what's published (verified directly
// — reusing the same table for Premium Foil, as an earlier version of
// this config did, overshoots Rare by roughly 1.5x once simulated; see
// the calibration test). Premium Foil is modelled as Common instead —
// still meaningfully different from an ordinary common pull since it's
// guaranteed foil, just not an extra source of Rare/Majestic/Legendary.
// Cold Foil: "First Edition containing 1 Cold Foil every 22 packs" —
// attached to the Premium Foil line, so coldFoilReplaces targets it, by
// the same inference used for Welcome to Rathe's Alpha cold foil.
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
// Monarch (MON) — 16 cards.
// fabtcg.com/products/booster-set/monarch-unlimited/ (the First Edition
// slug redirects to a Blitz Deck page — this Unlimited URL has the real
// booster product). Verbatim: "Token - 1 per pack; Premium Foil - 1 per
// pack (Rainbow Foil); Rare or higher - 1 + 1 per pack (1 Rare + 1 Rare/
// Majestic); Equipment - 1 per pack; Common - 11 per pack." Sum:
// 1 + 1 + 2 + 1 + 11 = 16. No Super Rare here (retired by this set — the
// real data confirms zero Super Rare printings for Monarch) and, like
// Welcome to Rathe/Arcane Rising, Legendary isn't named in "Rare or
// higher" at all.
//
// Checked against real data: 4 of this set's 6 real Legendary printings
// are Equipment-type (the other 2 aren't reachable in a normal pack, same
// as the unreachable ones on every set here — not every printed card is
// necessarily a booster pull). Collectors-centre states Legendary at
// "1 per 96 packs", same rate as Welcome to Rathe/Arcane Rising, and the
// same reasoning applies: that rate is modelled directly as the
// Equipment slot's weight (1/96 Legendary, 95/96 Common), and Legendary
// is excluded from "Rare or higher" to avoid double-counting it.
// With Legendary excluded, "Rare or higher"'s own rates (1.75 Rare, 0.25
// Majestic per pack) sum to exactly 2 — confirmation the 2-slot, no-
// Legendary reading is right. The guaranteed pure Rare already accounts
// for 1.0 of that 1.75, so the "Rare/Majestic" slot's own rate needs to
// be Rare 0.75, Majestic 0.25 (sum 1.0 exactly) — scaled to whole numbers
// (x4): Rare 3, Majestic 1. That leaves nothing for the separate Premium
// Foil (Rainbow Foil) slot to add without overshooting the published
// rate, so it's modelled as Common — same reasoning as Welcome to
// Rathe/Crucible of War above.
// Cold Foil: "First Edition containing 1 Cold Foil every 22 packs",
// attached to the Premium Foil slot as with Crucible of War.
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
// Tales of Aria (ELE) — 16 cards.
// fabtcg.com/products/booster-set/tales-of-aria/. Verbatim: "Premium Foil
// - 1 per pack (Rainbow Foil or Cold Foil); Rare or higher - 1 + 1 per
// pack (1 Rare + 1 Rare/Majestic); Common - 12 per pack; Token - 1 per
// pack." Sum: 1 + 2 + 12 + 1 = 16. No Equipment slot for this set (real
// Equipment-type cards exist, same as every set here, but aren't their
// own named slot).
//
// Unlike Welcome to Rathe/Arcane Rising/Monarch, this set has no Equipment
// slot to explain where Legendary comes from, so it must be reachable via
// "Rare or higher" or Premium Foil. The named pair is explicitly "1 Rare +
// 1 Rare/Majestic" (2 options, no Legendary), so Legendary is folded into
// the Premium Foil slot instead — the same reasoning as every set here,
// applied to whichever slot's text doesn't foreclose it.
//
// The guaranteed pure Rare already accounts for 1.0 of the published 1.75
// Rare/pack, so the "Rare/Majestic" pair slot's own rate needs to be Rare
// 0.75, Majestic 0.25 (sum 1.0 exactly) — scaled to whole numbers (x4):
// Rare 3, Majestic 1. That fully explains the published Rare and Majestic
// rates on its own, so — same reasoning as every other set in this file —
// the Premium Foil slot doesn't add more Rare/Majestic on top of it, and
// instead carries the entire published Legendary rate (1/88), with the
// remainder landing on Common: Legendary 1, Common 87 (of 88).
// Cold Foil: "First Edition also containing 1 Cold Foil every 20 packs" -
// attached to the Premium Foil slot, same pattern as every set here.
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
// Bright Lights (EVO) — 16 cards. Rates from
// https://fabtcg.com/collectors-centre/bright-lights/ :
//   1 Fabled (1 per ??? packs) / 7 Legendary (1 per 70 packs) /
//   46 Majestic (1 per 4 packs) / 56 Rare (1.68 per pack) /
//   129 Common (11 per pack) / 12 Token (1.8~ per pack) /
//   Premium Foil (1 per pack) / Cold Foil (1 per 24 packs) /
//   9 Marvels (1 per ??? packs)
//
// Structurally this is the Heavy Hitters family, but it is NOT built by
// that builder, because its page stops short of one thing all four of
// those publish: a rarity breakdown for the Premium Foil slot. So its
// premium card is modelled the older way, as a Common carrying the set's
// one published Legendary rate, rather than with the family's 1/96-1/18-
// 5/24-18/24 table, which this set never states.
//
// Its rates sum to 1.68 + 0.25 + 11 + 1.8 + 1 = 15.73, i.e. 16 cards, which
// settles a question the old product-page reading could not: that page's
// slot list only ever summed to 15 and the missing sixteenth card had to be
// assumed. It is a second Token/Common slot, not a Basic wildcard.
//
// Marvel is printed as "1 per ??? packs" here, so it takes the estimate.
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
// High Seas (SEA) — 16 cards.
// Rates from https://fabtcg.com/collectors-centre/high-seas/ (transcribed
// verbatim in docs/pull-rate-verification.md). The base block:
//   1 Fabled / 6 Legendary / 46 Majestic (1 per 4 packs) /
//   64 Rare (1.83 per pack) / 127 Common (11 per pack) / 18 Basic
// then a second block under "Premium Foil (1 per pack)":
//   1 Fabled (1 per ??? packs) / 6 Legendary (1 per 96 packs) /
//   33 Majestic (1 per 18 packs) / 60 Rare (5 per 24 packs) /
//   85 Common (18 per 24 packs) / 21 Marvels (1 per 60 packs)
//
// That second block is the Premium Foil slot's own rarity table, not an
// extra set of pack-wide rates: its listed rates sum to 1.04, and a block
// summing to one card is the distribution for one card. So Legendary and
// Marvel are premium-slot outcomes here, and they appear in exactly one
// slot. The product page names the last slot "Basic / Expansion Slot /
// Marvel / Legendary", but a product page says what CAN appear in a slot
// while the Collectors Centre gives the rates, and rates are what this
// models. Normalising that 1.04 back to 1.0 costs every premium rate about
// 4%, well inside the calibration tolerance.
//
// Base Majestic is pinned at 1 per 4 packs in total. Expansion-slot
// printings are Majestic rarity, so they come OUT of that 0.25 rather than
// on top of it — the split between the Rare-or-Majestic slot (0.20) and the
// wildcard's expansion entry (0.05) is ours, since LSS publishes no
// expansion rate for this set, but the total is the published one and the
// total is what tests/pack-opener/calibration.test.ts asserts. Keeping a
// small share there is what keeps expansion cards pullable at all.
//
// Base Rare lands at 1.80 against a published 1.83, because Majestic has
// to come out of the same two rare-or-higher slots. 2% under, left alone.
//
// Fabled is deliberately absent: both blocks print "1 per ??? packs" for
// it, and an invented rate is worse than an unpullable card.
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
// compendium-of-rathe/ (the-fab-cube's data has null product_page/
// collectors_center for this set — this live page exists under a
// different URL pattern than the-fab-cube points to, same situation as
// several of the older sets above). "Product Configuration: ... 9 cards
// per pack." "Rarity Distribution: Cold Foil - 1 per 8 packs (replaces a
// Rare); Rainbow Foil - 1 per pack; Rare or higher - 3 per pack (2 Rare +
// 1 Rare, Majestic, Legendary, or Marvel); Common - 5 per pack." Sum:
// 1 + 3 + 5 = 9 — Rainbow Foil is a separate card here too (matches the
// modern-era pattern; 3 + 5 = 8 without it, one short of the stated 9).
//
// Rates, from this set's Collectors Centre breakdown (its page renders
// behind JavaScript tabs, so this was read off the live page by hand
// rather than scraped):
//   8 Legendary (1 per 140 packs) / 59 Majestic (1 per 3.15 packs) /
//   124 Rare (2.55 per pack) / 142 Common (5 per pack) /
//   1 Premium Foil (1 per pack), itself being
//     30 Majestic (1 per 24) / 59 Rare (5 per 24) / 140 Common (18 per 24)
//   Cold Foil (1 per 8 packs), being 21 Majestic / 60 Rare
//   23 Marvel (1 per 96 packs)
// The premium block sums to exactly 1.00, confirming it describes that one
// card rather than more pack-wide rates.
// Base sum: 0.007 + 0.318 + 2.55 + 5 + 1 = 8.87, i.e. the 9-card pack.
// Two guaranteed Rares leave 0.55 Rare for the third slot, which also
// carries the whole of Majestic and Legendary, with Common taking the
// 0.125 of slack the published rounding leaves.
//
// The Cold Foil block lists only Majestic and Rare, no Common, and at 1 per
// 8 packs it is by far the most frequent in this file. The engine upgrades
// an existing card's treatment rather than changing its rarity, so it is
// pointed at the third slot, whose draw is already Rare or Majestic about
// 87% of the time - the closest that mechanism gets to the published block.
// ---------------------------------------------------------------------------
// Weights are the published rates over 10,000 draws.
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
// Outsiders (OUT) — 16 cards. fabtcg.com/products/booster-set/outsiders/
// states "A booster pack contains 16 cards, being: Rainbow Foil - 1 per
// pack; Rare or higher - 1-2 per pack; Common - 11-12 per pack; Token - 2
// per pack; Cold Foil - 1 per 24 packs." Unlike every other set in this
// file, this is a genuine published *range*, not an ambiguity introduced
// by scraping — confirmed by fetching the live page directly. Per the
// product owner: approximate it as closely as possible using whatever
// real numbers can be found, rather than picking an arbitrary rate.
//
// Found: the collectors-centre page (fabtcg.com/en/collectors-centre/
// outsiders/) gives the precise averages behind that range: "51 Rares
// (1.75 per pack); 31 Majestic (1 per 5 packs); 5 Legendary (Rainbow Foil
// - 1:70 packs / Cold Foil - 1:264 packs); 128 Commons (11 per pack); 20
// Tokens (1.75 tokens per pack)."
//
// Slot count check: Rare 1.75 + Majestic 0.2 (1/5) + Legendary 0.0143
// (1/70) = 1.9643 -> rounds to 2 rare-or-better slots, matching the
// product page's "1-2" (a guaranteed pure Rare, plus a second slot that's
// usually Rare and sometimes Majestic). The Legendary rate is specifically
// described in terms of the Rainbow Foil treatment, so — same reasoning
// as Welcome to Rathe's Equipment channel — it's modelled as reachable
// only via the Premium Foil (Rainbow Foil) slot, at exactly 1/70, with
// the remainder Common. That leaves the second "rare or better" slot to
// explain Rare (0.75 of the 1.75 total, since the pure slot already
// covers 1.0) and Majestic (0.2, entirely) on its own: roughly 80%
// Rare / 20% Majestic, which conveniently is exactly what "1 per 5
// packs" already says about Majestic on its own — so that slot is
// modelled as a clean 4:1 Rare:Majestic split.
//
// Token's own published average (1.75, not a flat 2) implies a similar
// "usually 1, sometimes 2" mechanic trading off against Common — the
// engine here only supports a fixed card count per slot, not a
// probabilistic *count*, so Token is modelled as a flat 2 and Common as a
// flat 11 (matching the collectors-centre's own Common number). This
// slightly overstates how often a pack has 2 Tokens rather than 1, and is
// the one place in this config that's a real simplification rather than a
// direct translation of a published number — flagged here rather than
// left silent.
//
// The separate "Cold Foil - 1 per 24 packs" line (distinct from the
// Legendary-specific 1:264 Cold Foil rate above, which is a treatment
// upgrade *within* that already-rare Legendary pull, not modelled
// separately here) matches the family default — targeting Token, by the
// same inference used for every set in this file whose page doesn't
// explicitly say what Cold Foil replaces.
// Real population: rare 51, majestic 34, legendary 5, marvel 3, token 20.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/outsiders/ :
//   1 Fabled (1 per ??? packs) /
//   5 Legendary (Rainbow Foil 1:70, Cold Foil 1:264) /
//   31 Majestic (1 per 5 packs) / 51 Rare (1.75 per pack) /
//   128 Common (11 per pack) / 20 Tokens (1.75 per pack) /
//   Premium Foil (1 per pack) / Cold Foil (1 per 24 packs) /
//   3 Marvels (1 per ??? packs)
// Rare, Majestic and Legendary here were already derived from these rates
// and are unchanged. Token was not: two guaranteed token slots deal 2.00 a
// pack against a published 1.75, so the second one now lands on a Common
// the remaining eighth of the time.
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
// fabtcg.com/products/booster-set/history-pack-1-en/, "Pack
// Configuration: 10 cards per booster pack; Rare or higher - 1 per pack;
// Rare - 1 per pack; Common - 8 per pack." Sum: 1 + 1 + 8 = 10. A History
// Pack is explicitly "designed to support card accessibility for
// constructed play, not intended for booster draft or sealed deck play"
// — no Token, Premium Foil, or Cold Foil slot at all, matching its
// simpler reprint-focused design. This is also the set the automatic
// derivation rule structurally can't find on its own (see known-sets.ts)
// since it has no Rainbow Foil printing at all.
// Real population: common 238, rare 118, majestic 62, legendary 9. No
// published split for "Rare or higher"'s own rarities — weighted by
// population, same convention as every other config here where LSS
// states a slot's membership without its internal weights. No separate
// premium/foil slot exists to double-count against here, unlike the
// sets fixed earlier in this file.
// ---------------------------------------------------------------------------
// Rates from https://fabtcg.com/collectors-centre/history-pack-1/ :
//   9 Legendary (1 per 82 packs) / 62 Majestic (1 per 3.15 packs) /
//   118 Rare (1.65 per pack) / 208 Common (7 per pack)
//   *3 Fabled and *8 Marvel are Black Label product only, not boosters,
//   which is why marvelChance stays 0 for this set alone.
// Rare 1.65 is the one guaranteed Rare plus 0.65 from the second slot;
// Majestic and Legendary make up most of the rest of it, with Common
// taking the last 2%. Weights are those rates over 10,000 draws.
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

export const REAL_SET_PACK_CONFIGS: Record<string, PackConfig> = {
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

/** The live fabtcg.com product/collectors-centre page each config above was
 * sourced from — see that set's own comment for the exact quoted text.
 * Kept as a separate table rather than a field on PackConfig so the odds
 * engine itself (pack/generate-pack.ts) never needs to know this exists;
 * only the set info dialog (components/carousel/SetInfoDialog.tsx) reads
 * it. Several of these are the *live* URL, not the-fab-cube's own
 * (frequently stale or null) product_page field — see each set's comment
 * above for why. */
export const SET_SOURCE_URLS: Record<string, string> = {
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
