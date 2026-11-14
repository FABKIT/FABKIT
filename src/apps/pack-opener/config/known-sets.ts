import type { SetIndexEntry } from "@fabkit/shared/data/fab-printings";

/**
 * Every set code the project has made a decision about.
 * scripts/build-pack-data.ts derives candidate sets from the upstream data
 * and fails the build on any candidate with no entry here, so a new release
 * can't ship or be left out without someone deciding. An "include" also adds
 * a set the automatic rule did not surface.
 */

interface KnownSetDecision {
	code: string;
	decision: "include" | "exclude";
	/** Defaults to "booster-set". "supplemental" is any other sealed
	 * randomised pack; the set picker groups on this. */
	kind?: SetIndexEntry["productKind"];
}

export const KNOWN_SETS: KnownSetDecision[] = [
	{ code: "WTR", decision: "include" },
	{ code: "ARC", decision: "include" },
	{ code: "CRU", decision: "include" },
	{ code: "MON", decision: "include" },
	{ code: "ELE", decision: "include" },
	{ code: "EVR", decision: "include" },
	// History Pack 1 has no Rainbow Foil printing, so the automatic rule
	// misses it.
	{ code: "1HP", decision: "include" },
	{ code: "UPR", decision: "include" },
	{ code: "DYN", decision: "include" },
	{ code: "OUT", decision: "include" },
	{ code: "DTD", decision: "include" },
	{ code: "EVO", decision: "include" },
	{ code: "HVY", decision: "include" },
	{ code: "MST", decision: "include" },
	{ code: "ROS", decision: "include" },
	{ code: "HNT", decision: "include" },
	{ code: "SEA", decision: "include" },
	{ code: "SUP", decision: "include" },
	{ code: "PEN", decision: "include" },
	{ code: "OMN", decision: "include" },
	// Armory prize packs. Upstream files every GEM Pack under this one code;
	// SET_SPLITS in scripts/build-pack-data.ts cuts them into GEM1 to GEM5.
	{ code: "GEM", decision: "include", kind: "supplemental" },
	// "Round the Table: TCC X LSS", a crossover promo product.
	{ code: "TCC", decision: "exclude" },
	// Mastery Packs are single-class but sold as booster packs with a
	// published configuration.
	{ code: "MPG", decision: "include", kind: "supplemental" },
	{ code: "MPW", decision: "include", kind: "supplemental" },
	// Tournament Pack: not released, and no published configuration to build
	// a pack from. Revisit when it ships.
	{ code: "TNP", decision: "exclude" },
	// Worlds and Pro Tour prize cards, not a sealed product.
	{ code: "WIN", decision: "exclude" },
	// Antiquity Pack, bundled one per Compendium of Rathe booster box.
	{ code: "ANQ", decision: "include", kind: "supplemental" },
	// Usurp the Shadow Throne. Upstream has no release date for it yet, so the
	// automatic rule misses it. Card data comes through
	// scripts/pre-release-bridge.ts for now.
	{ code: "IAR", decision: "include" },
];
