/**
 * Client-side daily card selection.
 *
 * selectDaily() deterministically picks one card per day from the curated daily
 * pool (Standard: 350-card selection; Chaos: full eligible pool). The same date
 * always produces the same card on every device — no server needed.
 *
 * Anti-repeat guarantee: the pool is shuffled once with a fixed seed, then cards
 * are picked sequentially by day offset from FABBLE_EPOCH. No card repeats until
 * the full pool has cycled (350 days for Standard, much longer for Chaos).
 *
 * When the daily pool is updated (new selection after a meta shift), FABBLE_EPOCH
 * is NOT reset — the day offset keeps incrementing, and the new pool's shuffle
 * produces a fresh sequence. Existing in-progress sessions restore their daily
 * from localStorage (see session.ts) so active players are never disrupted.
 */

import type { CanonicalCard, DailyCard, FabbleMode } from "./types";

// ─── Epoch ────────────────────────────────────────────────────────────────────
// The reference date for computing day offsets. Never reset this — incrementing
// the offset through pool updates is intentional (preserves session continuity).

export const FABBLE_EPOCH = "2026-05-20";

// ─── Shuffle seed per mode ────────────────────────────────────────────────────
// Different seeds so Standard and Chaos don't share the same pick sequence.

const SHUFFLE_SEEDS: Record<FabbleMode, string> = {
	standard: "fabble:v1:standard:shuffle",
	chaos:    "fabble:v1:chaos:shuffle",
};

// ─── cyrb53 — deterministic 53-bit hash ──────────────────────────────────────
// Fast non-cryptographic hash. Same algorithm as the original Cloudflare Worker.
// Returns a number in [0, 2^53).

export function cyrb53(str: string, seed = 0): number {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 =
		Math.imul(h1 ^ (h1 >>> 16), 2246822519) ^
		Math.imul(h2 ^ (h2 >>> 13), 3266489917);
	h2 =
		Math.imul(h2 ^ (h2 >>> 16), 2246822519) ^
		Math.imul(h1 ^ (h1 >>> 13), 3266489917);
	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// ─── buildShuffledPool ────────────────────────────────────────────────────────
// Applies a deterministic Fisher-Yates shuffle to the pool using cyrb53 as the
// PRNG seed. The result is stable for a given pool + seed combination.

function buildShuffledPool(
	pool: CanonicalCard[],
	shuffleSeed: string,
): CanonicalCard[] {
	const arr = [...pool];
	// Seed a simple LCG with cyrb53 output for fast uniform random numbers
	let state = cyrb53(shuffleSeed) >>> 0;
	const rand = (): number => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 0x100000000;
	};
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const tmp = arr[i];
		arr[i] = arr[j] as CanonicalCard;
		arr[j] = tmp as CanonicalCard;
	}
	return arr;
}

// ─── daysBetween ─────────────────────────────────────────────────────────────

function daysBetween(epochStr: string, todayStr: string): number {
	const msPerDay = 1000 * 60 * 60 * 24;
	const epoch = Date.UTC(
		Number(epochStr.slice(0, 4)),
		Number(epochStr.slice(5, 7)) - 1,
		Number(epochStr.slice(8, 10)),
	);
	const today = Date.UTC(
		Number(todayStr.slice(0, 4)),
		Number(todayStr.slice(5, 7)) - 1,
		Number(todayStr.slice(8, 10)),
	);
	return Math.floor((today - epoch) / msPerDay);
}

// ─── buildDailyCard ───────────────────────────────────────────────────────────

function buildDailyCard(
	canonical: CanonicalCard,
	variant: CanonicalCard["pitchVariants"][number],
): DailyCard {
	return {
		cardIdentifier: variant.cardIdentifier,
		name: canonical.name,
		types: canonical.types,
		classes: canonical.classes,
		talents: canonical.talents,
		pitch: variant.pitch,
		cost: canonical.cost,
		power: canonical.power,
		defense: canonical.defense,
		lifeOrIntellect: canonical.lifeOrIntellect,
		subtypes: canonical.subtypes,
		keywords: canonical.keywords,
		sets: canonical.sets,
		earliestSetIndex: canonical.earliestSetIndex,
		isRainbow: canonical.isRainbow,
		rarities: canonical.rarities,
		artists: canonical.artists,
		pitchVariantImage: variant.defaultImage,
	};
}

// ─── selectDaily ─────────────────────────────────────────────────────────────
/**
 * Picks the daily card for a given date and mode.
 *
 * @param dailyPool - The eligible daily pool (350 curated cards for Standard;
 *                    full non-banned pool for Chaos). Must not be empty.
 * @param today     - Today's date as "YYYY-MM-DD" (UTC).
 * @param mode      - "standard" or "chaos" (determines shuffle seed).
 */
export function selectDaily(
	dailyPool: CanonicalCard[],
	today: string,
	mode: FabbleMode,
): DailyCard {
	const shuffled = buildShuffledPool(dailyPool, SHUFFLE_SEEDS[mode]);
	const offset = daysBetween(FABBLE_EPOCH, today);
	// Positive modulo so dates before epoch map safely (shouldn't happen in production)
	const index = ((offset % shuffled.length) + shuffled.length) % shuffled.length;
	const canonical = shuffled[index] as CanonicalCard;

	// Pick pitch variant deterministically: use a secondary hash of today + variant count
	const variants = canonical.pitchVariants;
	let variant: CanonicalCard["pitchVariants"][number];
	if (variants.length === 0) {
		// Fallback: construct a minimal variant from the canonical card itself
		variant = {
			pitch: undefined,
			cardIdentifier: canonical.name.toLowerCase().replace(/\s+/g, "-"),
			defaultImage: "",
		};
	} else if (variants.length === 1) {
		variant = variants[0] as CanonicalCard["pitchVariants"][number];
	} else {
		const pitchHash = cyrb53(`${today}:${mode}:pitch`);
		variant = variants[pitchHash % variants.length] as CanonicalCard["pitchVariants"][number];
	}

	return buildDailyCard(canonical, variant);
}
