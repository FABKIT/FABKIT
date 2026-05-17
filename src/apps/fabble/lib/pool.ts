import { EXCLUDED_TYPES, SET_ORDER } from "./constants";
import type { CanonicalCard, NumericStat, RawCard } from "./types";

// ─── PopularityProvider interface ─────────────────────────────────────────────
// Provides popularity weights for cards. Weights are relative; selection
// algorithm normalizes them. A real implementation would supply weights derived
// from tournament frequency data (e.g. FaBlazing card frequency across CC decks).
// Contact blazingdatafab@gmail.com before building a scraper or integration.
export interface PopularityProvider {
	/** Returns the relative weight for a card name. Returns 1.0 if unknown. */
	getWeight(cardName: string): number;
}

/** Stub: uniform weights for all cards. Do NOT swap for a real implementation
 * without explicit review. */
export const uniformPopularityProvider: PopularityProvider = {
	getWeight(_cardName: string): number {
		return 1.0;
	},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function deriveNumericStat(
	numeric: number | undefined,
	special: string | undefined,
): NumericStat {
	if (numeric !== undefined) return { kind: "numeric", value: numeric };
	if (special !== undefined) return { kind: "special", value: special };
	return { kind: "na" };
}

export function deriveLifeOrIntellect(
	card: RawCard,
): { value: number; label: "life" | "intellect" } | undefined {
	// Hero: intellect takes priority
	if (card.types.includes("Hero")) {
		if (card.intellect !== undefined)
			return { value: card.intellect, label: "intellect" };
		if (card.life !== undefined) return { value: card.life, label: "life" };
	}
	// Ally: identified by "Ally" in subtypes (Ally cards have empty types array)
	if (card.subtypes?.includes("Ally")) {
		if (card.life !== undefined) return { value: card.life, label: "life" };
	}
	return undefined;
}

export function computeEarliestSetIndex(setIdentifiers: string[]): number {
	let min = Infinity;
	const unknownCodes: string[] = [];
	for (const id of setIdentifiers) {
		const code = id.slice(0, 3); // e.g. "1HP009" → "1HP", "WTR001" → "WTR"
		const idx = SET_ORDER.indexOf(code);
		if (idx !== -1) {
			if (idx < min) min = idx;
		} else {
			unknownCodes.push(code);
		}
	}
	if (unknownCodes.length > 0) {
		// Build-time warning only
		const unique = [...new Set(unknownCodes)];
		console.warn(
			`[build-pool] Unknown set codes (Infinity index): ${unique.join(", ")}`,
		);
	}
	return min; // Infinity if all codes are unknown
}

// ─── Standard pool filter ─────────────────────────────────────────────────────

/**
 * Standard pool: all guessable cards (correct types, all rarities, includes banned).
 * Banned cards are included so players can search and guess them; daily selection
 * filters them out at runtime via the isBanned flag on each CanonicalCard.
 */
export function filterForStandard(cards: RawCard[]): RawCard[] {
	return cards.filter((card) => {
		if (card.types.some((t: string) => EXCLUDED_TYPES.has(t))) return false;
		if (card.isCardBack === true) return false;
		return true;
	});
}

// ─── Chaos pool filter ────────────────────────────────────────────────────────

/**
 * Returns the subset of raw card objects eligible for the Chaos pool.
 * All cards (including banned) pass except for excluded types and promos.
 */
export function filterForChaos(cards: RawCard[]): RawCard[] {
	return cards.filter((card) => {
		// Same type exclusions as Standard
		if (card.types.some((t: string) => EXCLUDED_TYPES.has(t))) return false;
		if (card.isCardBack === true) return false;
		// NO rarity exclusion
		// NO ban exclusion (Chaos includes banned cards)
		return true;
	});
}

// ─── Group by name (rainbow collapse) ────────────────────────────────────────

/**
 * Groups raw card objects by name, collapsing pitch variants into a single
 * CanonicalCard. Returns array sorted by name (case-insensitive ascending).
 */
export function groupByName(
	filteredCards: RawCard[],
	popularityProvider: PopularityProvider,
): CanonicalCard[] {
	// Step 1: group by name
	const groups = new Map<string, RawCard[]>();
	for (const card of filteredCards) {
		const existing = groups.get(card.name) ?? [];
		existing.push(card);
		groups.set(card.name, existing);
	}

	const result: CanonicalCard[] = [];

	for (const [name, variants] of groups) {
		const rep = variants[0]; // representative for type-level fields

		// pitchSet: collect all pitch values across variants
		const pitchSet = variants
			.map((v) => v.pitch)
			.filter((p): p is number => p !== undefined)
			.sort((a, b) => a - b); // ascending: [1, 2, 3]
		const isRainbow = pitchSet.length > 1;

		// pitchVariants: used for daily card pitch resolution
		const pitchVariants = variants.map((v) => ({
			pitch: v.pitch,
			cardIdentifier: v.cardIdentifier,
			defaultImage: v.defaultImage ?? v.cardIdentifier,
		}));

		// Derive NumericStat for cost, power, defense
		const cost = deriveNumericStat(rep.cost, rep.specialCost);
		const power = deriveNumericStat(rep.power, rep.specialPower);
		const defense = deriveNumericStat(rep.defense, rep.specialDefense);

		// Derive lifeOrIntellect
		const lifeOrIntellect = deriveLifeOrIntellect(rep);

		// Collect all sets and compute earliestSetIndex
		const allSetIdentifiers = [
			...new Set(variants.flatMap((v) => v.setIdentifiers ?? [])),
		];
		const earliestSetIndex = computeEarliestSetIndex(allSetIdentifiers);

		// Build a map from set name → minimum SET_ORDER index, using per-variant
		// (sets[i], setIdentifiers[i]) pairings so each set name gets its own index.
		const setNameToIndex = new Map<string, number>();
		for (const v of variants) {
			const vSets: string[] = v.sets?.map(String) ?? [];
			const vIds: string[] = v.setIdentifiers ?? [];
			for (let i = 0; i < vSets.length; i++) {
				const setName = vSets[i];
				const code = vIds[i]?.slice(0, 3);
				if (!setName || !code) continue;
				const idx = SET_ORDER.indexOf(code);
				if (idx === -1) continue;
				const existing = setNameToIndex.get(setName);
				if (existing === undefined || idx < existing) {
					setNameToIndex.set(setName, idx);
				}
			}
		}

		// Collect all set names, sorted by earliestSetIndex for evaluateSet
		const allSetNames = [
			...new Set(variants.flatMap((v) => v.sets?.map(String) ?? [])),
		];
		// Sort sets by their set index (earliest first)
		allSetNames.sort((a, b) => {
			const aIdx = setNameToIndex.get(a) ?? Infinity;
			const bIdx = setNameToIndex.get(b) ?? Infinity;
			return aIdx - bIdx;
		});

		// Collect all rarities
		const rarities = [
			...new Set(variants.flatMap((v) => v.rarities?.map(String) ?? [])),
		];

		// Banned if any variant is banned in Classic Constructed
		const isBanned = variants.some((v) =>
			v.bannedFormats?.includes("Classic Constructed"),
		);

		// Collect all artists across variants
		const artists = [
			...new Set(variants.flatMap((v) => v.artists?.map(String) ?? [])),
		];

		// Popularity weight
		const weight = popularityProvider.getWeight(name);

		result.push({
			name,
			types: [...rep.types.map(String)],
			classes: [...(rep.classes?.map(String) ?? [])],
			talents: [...(rep.talents?.map(String) ?? [])],
			pitchSet,
			cost,
			power,
			defense,
			lifeOrIntellect,
			subtypes: [
				...new Set(variants.flatMap((v) => v.subtypes?.map(String) ?? [])),
			],
			keywords: [
				...new Set(variants.flatMap((v) => v.keywords?.map(String) ?? [])),
			],
			sets: allSetNames,
			earliestSetIndex,
			isRainbow,
			isBanned,
			isAmbiguous: false, // set to true by build script for fingerprint collisions
			rarities,
			artists,
			weight,
			pitchVariants,
		});
	}

	// Stable sort by name, case-insensitive (critical for deterministic selection)
	result.sort((a, b) =>
		a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
	);
	return result;
}
