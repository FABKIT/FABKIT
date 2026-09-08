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
const uprRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 51 },
	{ rarity: "majestic" as const, weight: 27 },
];
const uprPremiumTable = [
	{ rarity: "common" as const, weight: 127 },
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
// Premium Foil modelled as Common-primary with a population-weighted
// sliver of Legendary, not a reuse of the named pair's own table — same
// double-counting fix as Uprising above.
// ---------------------------------------------------------------------------
const dynRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 81 },
	{ rarity: "majestic" as const, weight: 51 },
];
const dynPremiumTable = [
	{ rarity: "common" as const, weight: 109 },
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
// Premium Foil modelled as Common-primary with a population-weighted
// sliver of Legendary, not a reuse of the named pair's own table — same
// double-counting fix as Uprising/Dynasty above.
// ---------------------------------------------------------------------------
const dtdRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 77 },
	{ rarity: "majestic" as const, weight: 56 },
];
const dtdPremiumTable = [
	{ rarity: "common" as const, weight: 94 },
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
// Premium Foil modelled as Common only, not a reuse of the named pair's
// own table — the same double-counting fix as Uprising/Dynasty/Dusk till
// Dawn above, except here Legendary already has its own channel (the
// wildcard slot below), so there's no need to keep a sliver of it in
// Premium Foil too.
// ---------------------------------------------------------------------------
const supRareOrHigherTable = [
	{ rarity: "rare" as const, weight: 40 },
	{ rarity: "superrare" as const, weight: 40 },
	{ rarity: "majestic" as const, weight: 14 },
];
const supPremiumTable = [{ rarity: "common" as const, weight: 1 }];

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
// Premium Foil modelled as Common only — same reasoning as Super Slam
// above (Legendary already has its own channel, the wildcard slot below).
// ---------------------------------------------------------------------------
const omnRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 60 },
	{ rarity: "majestic" as const, weight: 15 },
];
const omnPremiumTable = [{ rarity: "common" as const, weight: 1 }];

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
const wtrRareOrHigherTable = [
	{ rarity: "rare" as const, weight: 9 },
	{ rarity: "superrare" as const, weight: 2 },
	{ rarity: "majestic" as const, weight: 1 },
];
const wtrPremiumTable = [{ rarity: "common" as const, weight: 1 }];
const wtrEquipmentTable = [
	{ rarity: "legendary" as const, weight: 1, requiresType: "Equipment" },
	{ rarity: "common" as const, weight: 95, requiresType: "Equipment" },
];

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
	coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
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
const arcRareOrHigherTable = [
	{ rarity: "rare" as const, weight: 9 },
	{ rarity: "superrare" as const, weight: 2 },
	{ rarity: "majestic" as const, weight: 1 },
];
const arcPremiumTable = [{ rarity: "common" as const, weight: 1 }];
const arcEquipmentTable = [
	{ rarity: "legendary" as const, weight: 1, requiresType: "Equipment" },
	{ rarity: "common" as const, weight: 95, requiresType: "Equipment" },
];

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
	coldFoilChance: PUBLISHED_COLD_FOIL_CHANCE,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
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
const cruRareOrHigherTable = [
	{ rarity: "rare" as const, weight: 180 },
	{ rarity: "majestic" as const, weight: 60 },
	{ rarity: "legendary" as const, weight: 1 },
];
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
	coldFoilChance: 1 / 22,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
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
const monRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 3 },
	{ rarity: "majestic" as const, weight: 1 },
];
const monPremiumTable = [{ rarity: "common" as const, weight: 1 }];
const monEquipmentTable = [
	{ rarity: "legendary" as const, weight: 1, requiresType: "Equipment" },
	{ rarity: "common" as const, weight: 95, requiresType: "Equipment" },
];

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
	coldFoilChance: 1 / 22,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
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
const eleRareOrMajesticTable = [
	{ rarity: "rare" as const, weight: 3 },
	{ rarity: "majestic" as const, weight: 1 },
];
const elePremiumTable = [
	{ rarity: "legendary" as const, weight: 1 },
	{ rarity: "common" as const, weight: 87 },
];

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
	coldFoilChance: 1 / 20,
	coldFoilReplaces: "premium-foil",
	marvelChance: 0,
};

// ---------------------------------------------------------------------------
// Bright Lights (EVO) — 16 cards. fabtcg.com/products/booster-set/bright-lights/
// states "Product Configuration: ... 16 cards per pack" explicitly, but
// that same page's own "Rarity Distribution" list only sums to 15 (Cold
// Foil replaces a token; Rainbow Foil 1/pack folded into the pair; Rare or
// higher 2/pack; Common 11/pack; Token 1/pack; Token or Expansion Slot
// 1/pack = 2+11+1+1 = 15) — it's missing the "Basic/Expansion Slot/
// Marvel/Legendary" wildcard slot that every other set in this same
// generation (Heavy Hitters/Part the Mistveil/Rosetta/The Hunted) has,
// with an identical "Rarity Distribution" paragraph otherwise. Confirmed
// with the product owner that the pack size really is 16; modelled here as
// the same family structure with that wildcard slot restored, since every
// other line matches that family exactly and 16 only works out if it's
// there. This is the one config in this file that isn't a verbatim
// transcription — flagged so it isn't mistaken for one.
// Real population: rare 56, majestic 34 (12 more via Expansion Slot),
// marvel 9, legendary 4, token 12. No real Basic printings, same gap as
// the Heavy Hitters family — omitted from the wildcard table.
// ---------------------------------------------------------------------------
const BRIGHT_LIGHTS = buildHvyFamilyConfig("EVO", {
	rare: 56,
	majestic: 34,
	majesticExpansion: 12,
	marvel: 9,
	legendary: 4,
	token: 12,
});

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
};
