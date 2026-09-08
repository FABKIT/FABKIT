import {
	DEFAULT_COLD_FOIL_CHANCE,
	DEFAULT_MARVEL_CHANCE,
} from "@fabkit/apps/pack-opener/pack/rates";
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
export const PUBLISHED_COLD_FOIL_CHANCE = 1 / 24;

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
const evrRareOrHigherTable = [
	{ rarity: "rare" as const, weight: 61 },
	{ rarity: "majestic" as const, weight: 45 },
	{ rarity: "legendary" as const, weight: 3 },
];

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
			rarityTable: evrRareOrHigherTable,
		},
	],
	// The page states the premium slot itself is "Rainbow Foil or Cold
	// Foil" with no ratio — there's no separate token/basic slot for it to
	// replace, unlike every other set here. coldFoilReplaces targets the
	// premium slot directly, which the engine handles regardless of that
	// slot's existing fixedTreatment (see generate-pack.ts).
	coldFoilChance: DEFAULT_COLD_FOIL_CHANCE,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
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
// ---------------------------------------------------------------------------
const uprRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 51 },
	{ rarity: "majestic" as const, weight: 27 },
];
const uprPremiumTable = [
	{ rarity: "rare" as const, weight: 51 },
	{ rarity: "majestic" as const, weight: 27 },
	{ rarity: "legendary" as const, weight: 6 },
];

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
		{ kind: "token", count: 2, rarityTable: [{ rarity: "token", weight: 1 }] },
	],
	coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
	coldFoilReplaces: "token",
	marvelChance: DEFAULT_MARVEL_CHANCE,
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
// ---------------------------------------------------------------------------
const dynRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 81 },
	{ rarity: "majestic" as const, weight: 51 },
];
const dynPremiumTable = [
	{ rarity: "rare" as const, weight: 81 },
	{ rarity: "majestic" as const, weight: 51 },
	{ rarity: "legendary" as const, weight: 5 },
];

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
	coldFoilChance: 0,
	marvelChance: DEFAULT_MARVEL_CHANCE,
};

// ---------------------------------------------------------------------------
// Dusk till Dawn (DTD) — 10 cards.
// fabtcg.com/en/products/booster-set/dusk-till-dawn/
// "A booster pack contains 10 cards, being: Cold Foil - 1 per display
// (replaces a Rare); Rainbow Foil - 1 per pack; Rare or higher - 2 per
// pack (1 Rare + 1 Rare or Majestic); Common - 7 per pack." Sum: 1 + 2 + 7
// = 10 (Rainbow Foil is separate here too — see file comment).
// Real population: rare 77, majestic 56, legendary 8, marvel 10.
// ---------------------------------------------------------------------------
const dtdRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 77 },
	{ rarity: "majestic" as const, weight: 56 },
];
const dtdPremiumTable = [
	{ rarity: "rare" as const, weight: 77 },
	{ rarity: "majestic" as const, weight: 56 },
	{ rarity: "legendary" as const, weight: 8 },
];

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
	coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
	coldFoilReplaces: "rare",
	marvelChance: DEFAULT_MARVEL_CHANCE,
};

// ---------------------------------------------------------------------------
// Heavy Hitters / Part the Mistveil / Rosetta / The Hunted family — 16
// cards each. fabtcg.com product pages, "Rarity Distribution": Cold Foil
// - 1 per 24 packs (replaces a token); Rainbow Foil - 1 per pack; Rare or
// higher - 2 per pack (1 Rare + 1 Rare or Majestic); Common - 11 per pack;
// Basic / Expansion Slot / Marvel / Legendary - 1 per pack; Token - 1 per
// pack; Token / Expansion Slot - 1 per pack.
// Sum: 2 + 11 + 1 + 1 + 1 = 16 — here Rainbow Foil is NOT a separate card
// (unlike Uprising/Dynasty/Dusk till Dawn above): the sum only reaches 16
// if it's the guaranteed treatment on the "1 Rare or Majestic" half of the
// pair, so that's modelled as this family's premium-foil slot directly.
//
// None of these four sets has a single non-expansion-slot Basic printing
// in the-fab-cube's data — the wildcard slot's table omits Basic
// entirely rather than pointing at an empty pool (see file comment).
// "Token / Expansion Slot" and the wildcard's own Expansion Slot option
// both use a small placeholder weight against Majestic, since LSS doesn't
// publish how often either slot actually lands on Expansion Slot content.
// ---------------------------------------------------------------------------
interface HvyFamilyPopulation {
	rare: number;
	majestic: number;
	majesticExpansion: number;
	marvel: number;
	legendary: number;
	token: number;
}

function buildHvyFamilyConfig(
	id: string,
	pop: HvyFamilyPopulation,
): PackConfig {
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
				kind: "premium-foil",
				count: 1,
				fixedTreatment: "rainbow",
				rarityTable: [
					{ rarity: "rare", weight: pop.rare },
					{ rarity: "majestic", weight: pop.majestic },
				],
			},
			{
				kind: "basic-or-wildcard",
				count: 1,
				rarityTable: [
					{
						rarity: "majestic",
						weight: pop.majesticExpansion,
						expansionSlot: true,
					},
					{ rarity: "marvel", weight: pop.marvel },
					{ rarity: "legendary", weight: pop.legendary },
				],
			},
			{
				kind: "token",
				count: 1,
				rarityTable: [{ rarity: "token", weight: 1 }],
			},
			{
				kind: "token-or-wildcard",
				count: 1,
				rarityTable: [
					{ rarity: "token", weight: pop.token },
					{ rarity: "majestic", weight: 1, expansionSlot: true },
				],
			},
		],
		coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
		coldFoilReplaces: "token",
		marvelChance: 0,
	};
}

const HEAVY_HITTERS = buildHvyFamilyConfig("HVY", {
	rare: 67,
	majestic: 30,
	majesticExpansion: 10,
	marvel: 10,
	legendary: 5,
	token: 15,
});

const PART_THE_MISTVEIL = buildHvyFamilyConfig("MST", {
	rare: 54,
	majestic: 30,
	majesticExpansion: 13,
	marvel: 18,
	legendary: 6,
	token: 12,
});

const ROSETTA = buildHvyFamilyConfig("ROS", {
	rare: 57,
	majestic: 34,
	majesticExpansion: 15,
	marvel: 20,
	legendary: 5,
	token: 15,
});

const THE_HUNTED = buildHvyFamilyConfig("HNT", {
	rare: 66,
	majestic: 27,
	majesticExpansion: 15,
	marvel: 13,
	legendary: 5,
	token: 16,
});

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
// ---------------------------------------------------------------------------
const supRareOrHigherTable = [
	{ rarity: "rare" as const, weight: 40 },
	{ rarity: "superrare" as const, weight: 40 },
	{ rarity: "majestic" as const, weight: 14 },
];
const supPremiumTable = [
	{ rarity: "rare" as const, weight: 40 },
	{ rarity: "superrare" as const, weight: 40 },
	{ rarity: "majestic" as const, weight: 14 },
	{ rarity: "legendary" as const, weight: 2 },
];

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
			rarityTable: [
				{ rarity: "basic", weight: 9 },
				{ rarity: "majestic", weight: 28, expansionSlot: true },
				{ rarity: "legendary", weight: 2 },
				{ rarity: "marvel", weight: 8 },
			],
		},
	],
	coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
	coldFoilReplaces: "basic-or-wildcard",
	marvelChance: 0,
};

// ---------------------------------------------------------------------------
// Omens of the Third Age (OMN) — 16 cards. omen.fabtcg.com, "Rarity
// Distribution": Cold Foil - 1 per 24 packs (replaces a Basic); Common -
// 11 per pack; Rare or Majestic - 2 per pack (1 Rare + 1 Rare or
// Majestic); Rainbow Foil - 1 per pack; Basic - 2 per pack (1 Basic + 1
// Basic, Expansion Slot, Legendary, Marvel, or Fabled). Sum: 11 + 2 + 1
// (separate Rainbow Foil, same as Super Slam above) + 2 = 16.
// Real population: rare 60, majestic 15, legendary 4, basic 14, marvel 9,
// fabled 1 (this is the one set here whose page explicitly lists Fabled as
// a reachable outcome, and it does have exactly one real Fabled printing).
// ---------------------------------------------------------------------------
const omnRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 60 },
	{ rarity: "majestic" as const, weight: 15 },
];
const omnPremiumTable = [
	{ rarity: "rare" as const, weight: 60 },
	{ rarity: "majestic" as const, weight: 15 },
	{ rarity: "legendary" as const, weight: 4 },
];

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
			rarityTable: [
				{ rarity: "basic", weight: 14 },
				{ rarity: "majestic", weight: 22, expansionSlot: true },
				{ rarity: "legendary", weight: 4 },
				{ rarity: "marvel", weight: 9 },
				{ rarity: "fabled", weight: 1 },
			],
		},
	],
	coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
	coldFoilReplaces: "basic",
	marvelChance: 0,
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
};
