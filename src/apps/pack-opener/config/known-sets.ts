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

export interface KnownSetDecision {
	code: string;
	decision: KnownSetDecisionKind;
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
			'set.json names this "GEM Pack Promos" — a promo insert product, not a ' +
			"booster set. (It also currently carries no initial_release_date, so " +
			"the automatic rule already excludes it independently of this line.)",
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
		decision: "exclude",
		reason:
			"Mastery Pack Guardian — a single-class supplementary product, not a " +
			"booster set.",
	},
	{
		code: "MPW",
		decision: "exclude",
		reason:
			"Mastery Pack Warrior — a single-class supplementary product, not a " +
			"booster set.",
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
