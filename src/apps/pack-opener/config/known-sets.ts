/**
 * Every set code the project has made a decision about, per the
 * self-maintenance design in the execution plan (section 8.5). This is the
 * CI gate: scripts/build-pack-data.ts derives a candidate set list from the
 * upstream the-fab-cube data automatically (released + at least 50 distinct
 * printings + at least one Rainbow Foil printing — see that script's
 * deriveCandidates()), then cross-checks every candidate against this file.
 * A candidate with no entry here fails the build, printing the set's name,
 * release date and printing count — that failure IS the maintenance
 * mechanism. Nobody has to remember to watch for new releases; the next
 * deploy after LSS adds a set to the upstream data fails with a message
 * naming it, and the fix is one line here saying include or exclude and why.
 *
 * "include" also works the other way: a code listed here as "include" is
 * added to the final set list even if the automatic rule did not surface it
 * as a candidate (see 1HP below). This is the deliberate escape hatch for
 * sets the automatic rule structurally can't detect.
 */

export type KnownSetDecisionKind = "include" | "exclude";

/** What KIND of product a set is, as distinct from whether it ships.
 *
 * "booster-set" is a mainline Flesh and Blood booster set: the numbered
 * releases people draft and buy displays of. "supplemental" is everything
 * else that still comes in a sealed randomised pack — single-class Mastery
 * Packs, event prize packs, and so on. They open the same way but they are
 * not the same thing, and listing them interleaved by release date among
 * the mainline sets makes the set picker read as one long undifferentiated
 * list. The pack opener groups on this (see SetCarousel.tsx). */
export type ProductKind = "booster-set" | "supplemental";

export interface KnownSetDecision {
	code: string;
	decision: KnownSetDecisionKind;
	/** Defaults to "booster-set" when omitted, since most entries here are
	 * one. Only meaningful on an "include". */
	kind?: ProductKind;
	/** Why. Shows up next to the code, so future maintainers don't have to
	 * re-derive the reasoning from scratch. */
	reason: string;
}

export const KNOWN_SETS: KnownSetDecision[] = [
	{
		code: "WTR",
		decision: "include",
		reason: "Welcome to Rathe — standalone booster set.",
	},
	{
		code: "ARC",
		decision: "include",
		reason: "Arcane Rising — standalone booster set.",
	},
	{
		code: "CRU",
		decision: "include",
		reason: "Crucible of War — standalone booster set.",
	},
	{
		code: "MON",
		decision: "include",
		reason: "Monarch — standalone booster set.",
	},
	{
		code: "ELE",
		decision: "include",
		reason:
			"Tales of Aria — standalone booster set (upstream set code is ELE).",
	},
	{
		code: "EVR",
		decision: "include",
		reason: "Everfest — supplementary booster set, 10-card packs.",
	},
	{
		code: "1HP",
		decision: "include",
		reason:
			"History Pack 1 — sold as a pack product with a published pack structure. " +
			"The automatic rule misses it: it has no Rainbow Foil printing, so it " +
			"fails the booster-shape check on its own. Manual override.",
	},
	{
		code: "UPR",
		decision: "include",
		reason: "Uprising — standalone booster set.",
	},
	{
		code: "DYN",
		decision: "include",
		reason: "Dynasty — supplementary booster set, 10-card packs.",
	},
	{
		code: "OUT",
		decision: "include",
		reason: "Outsiders — standalone booster set.",
	},
	{
		code: "DTD",
		decision: "include",
		reason: "Dusk till Dawn — supplementary booster set, 10-card packs.",
	},
	{
		code: "EVO",
		decision: "include",
		reason:
			"Bright Lights — standalone booster set (upstream set code is EVO).",
	},
	{
		code: "HVY",
		decision: "include",
		reason: "Heavy Hitters — standalone booster set.",
	},
	{
		code: "MST",
		decision: "include",
		reason: "Part the Mistveil — standalone booster set.",
	},
	{
		code: "ROS",
		decision: "include",
		reason: "Rosetta — standalone booster set.",
	},
	{
		code: "HNT",
		decision: "include",
		reason: "The Hunted — standalone booster set.",
	},
	{
		code: "SEA",
		decision: "include",
		reason: "High Seas — standalone booster set.",
	},
	{
		code: "SUP",
		decision: "include",
		reason: "Super Slam — standalone booster set, 15-card packs.",
	},
	{
		code: "PEN",
		decision: "include",
		reason: "Compendium of Rathe — sold as a booster product.",
	},
	{
		code: "OMN",
		decision: "include",
		reason: "Omens of the Third Age — standalone booster set.",
	},
	{
		code: "GEM",
		decision: "exclude",
		reason:
			"GEM Packs — free Armory prize support rather than a product anyone " +
			"buys, and the one candidate here that could not be modelled even if " +
			"we wanted to. fabtcg.com/articles/gem_pack_faq/ gives the " +
			"configuration as 3 cards: 1 regular print, 1 premium foil (Rainbow, " +
			"Cold Foil or Marvel), 1 art card. But every one of its 308 printings " +
			"is promo rarity, so there is no rarity table to weight, LSS publishes " +
			"no split for the premium card, only 38% carry a TCGplayer id, and art " +
			"cards are not in the card data at all. Revisit only if that changes.",
	},
	{
		code: "TCC",
		decision: "exclude",
		reason:
			'"Round the Table: TCC X LSS" — a crossover promo product, not a ' +
			"booster set.",
	},
	{
		code: "MPG",
		decision: "include",
		kind: "supplemental",
		reason:
			"Mastery Pack Guardian — a real booster product, despite what this " +
			"entry used to say. fabtcg.com/products/product/mastery-pack-guardian/ " +
			'gives its product type as "Booster Pack" and publishes a full ' +
			"configuration: 13 cards per pack, 12 packs per display, 8 displays " +
			"per case, with a stated rarity distribution. Single-class is what it " +
			"is ABOUT, not what kind of product it is.",
	},
	{
		code: "MPW",
		decision: "exclude",
		reason:
			"Mastery Pack Warrior — the same kind of product as Mastery Pack " +
			"Guardian above, and its page publishes the same shape of " +
			"configuration, so it belongs here in principle. Held back on DATA, " +
			"not on principle: its page states 156 cards in the set but " +
			"the-fab-cube lists only 62 printings for it, and not one of them " +
			"carries a TCGplayer product id, so a pack would deal from a third of " +
			"the set and every card would read as unpriced. It released on 7 " +
			"August 2026; flip this to include once upstream has caught up.",
	},
	{
		code: "TNP",
		decision: "exclude",
		reason:
			"Tournament Pack — tournament prize support, not a product anyone " +
			"opens. All 30 of its printings are promo rarity and Cold Foil, with " +
			"no TCGplayer ids and so no prices, and there is no rarity structure " +
			"to build a pack out of.",
	},
	{
		code: "WIN",
		decision: "exclude",
		reason:
			"Worlds / Pro Tour Prize Cards — prize cards awarded at events, not a " +
			"sealed product. Same shape as TNP above: 45 printings, all promo, " +
			"all Cold Foil, no prices.",
	},
	{
		code: "ANQ",
		decision: "exclude",
		reason:
			"Compendium of Rathe - Antiquity Pack — a bonus insert bundled with " +
			"PEN, not its own booster set.",
	},
	{
		code: "IAR",
		decision: "exclude",
		reason:
			"Usurp the Shadow Throne — not released yet. A set with no published " +
			"odds and no market prices has nothing to show. The automatic rule " +
			"already excludes it (set.json carries no initial_release_date for " +
			"it); this line just records the decision so it isn't rediscovered as " +
			'an "unknown set" once upstream does add a date, and someone has to ' +
			"re-derive whether it belongs. Flip this to include once it has " +
			"actually shipped.",
	},
];
