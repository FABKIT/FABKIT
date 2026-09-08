/**
 * Community-estimate long-tail rates, shared by the mock config (odds.ts)
 * and the real per-set configs (set-configs.ts) — pulled out into their own
 * module so those two can both depend on it without depending on each
 * other.
 */

/**
 * LSS has never published an official per-set cold foil rate. ~1/22 packs is a
 * widely cited community estimate across recent non-Draft retail sets
 * (Part the Mistveil / The Hunted / Dusk till Dawn / Heavy Hitters) —
 * treat as an approximation, not a sourced constant. Used only by the mock
 * config; every real set in set-configs.ts either states its own rate
 * ("1 per display", converted to 1/24 — see that file's PUBLISHED_COLD_FOIL_CHANCE)
 * or states no cold-foil upgrade at all.
 */
export const DEFAULT_COLD_FOIL_CHANCE = 1 / 22;

/**
 * Marvel is an unofficial, unpublished ultra-rare alternate-art treatment.
 * No documented pull rate exists — community tracking suggests it varies
 * wildly per card/set (roughly 1:1000 up to documented outliers around
 * 1:10,000 for chase cards). 1/2000 is a rough placeholder, intentionally
 * configurable per set rather than a real published rate.
 */
export const DEFAULT_MARVEL_CHANCE = 1 / 2000;
