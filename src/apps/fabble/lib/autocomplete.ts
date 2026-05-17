import { AUTOCOMPLETE_MAX_RESULTS } from "./constants";
import type { CanonicalCard } from "./types";

// ─── Autocomplete item type ───────────────────────────────────────────────────

export interface AutocompleteItem {
	name: string;
	types: string[];
	alreadyGuessed: boolean;
	imageKey: string | undefined;
}

// ─── Normalize helper ─────────────────────────────────────────────────────────

// Diacritics: U+0300–U+036F (combining accents, stripped after NFD decomposition)
const RE_DIACRITICS = /[̀-ͯ]/g;
// Apostrophes removed so "Hunter's" = "Hunters", "Bolt'n'" = "Boltn"
// straight U+0027, right-curly U+2019, left-curly U+2018, low-9 U+201A,
// high-reversed U+201B, modifier-letter U+02BC, grave/backtick U+0060
const RE_APOSTROPHES = new RegExp(
	"['’‘‚‛ʼ`]",
	"g",
);
// Curly double quotes → straight (U+201C left, U+201D right, U+201E low-9, U+201F high-rev)
const RE_DBL_QUOTES = new RegExp("[“”„‟]", "g");

function normalize(str: string): string {
	return str
		.toLowerCase()
		.normalize("NFD")
		.replace(RE_DIACRITICS, "")
		.replace(RE_APOSTROPHES, "")
		.replace(RE_DBL_QUOTES, '"')
		.replace(/\s+/g, " ")
		.trim();
}

// ─── Search pool ──────────────────────────────────────────────────────────────

/**
 * Case-insensitive, accent-insensitive, apostrophe-insensitive card name search.
 * Prefix matches appear before substring matches.
 * Returns top 10 results.
 *
 * ~25 lines, no external library. Adequate for pools ≤ 1000 cards.
 */
export function searchPool(
	query: string,
	pool: CanonicalCard[],
	alreadyGuessed: string[],
): AutocompleteItem[] {
	if (query.trim().length === 0) return [];

	const normalizedQuery = normalize(query);
	const guessedSet = new Set(alreadyGuessed.map((n) => n.toLowerCase()));

	const prefixMatches: AutocompleteItem[] = [];
	const substringMatches: AutocompleteItem[] = [];

	for (const card of pool) {
		const normalizedName = normalize(card.name);
		const alreadyGuessedCard = guessedSet.has(card.name.toLowerCase());

		if (normalizedName.startsWith(normalizedQuery)) {
			prefixMatches.push({
				name: card.name,
				types: card.types,
				alreadyGuessed: alreadyGuessedCard,
				imageKey: card.pitchVariants[0]?.defaultImage,
			});
		} else if (normalizedName.includes(normalizedQuery)) {
			substringMatches.push({
				name: card.name,
				types: card.types,
				alreadyGuessed: alreadyGuessedCard,
				imageKey: card.pitchVariants[0]?.defaultImage,
			});
		}
	}

	// Prefix matches first, then substring matches — both groups already in
	// pool order (which is sorted alphabetically, so natural ordering is good).
	return [...prefixMatches, ...substringMatches].slice(
		0,
		AUTOCOMPLETE_MAX_RESULTS,
	);
}
