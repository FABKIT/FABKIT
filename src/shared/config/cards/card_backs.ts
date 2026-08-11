// public/ has no alias — Vite serves it at the root URL and relative import is the only static option.
import _CardBacks from "../../../../public/cardbacks/cardbacks.json";
import type { CardStyle } from "./card_styles.ts";
import type { CardType } from "./types.ts";

export type CardBackImage = {
	id: number;
	pitch: number;
	/** Static path under /cardbacks/. Empty for custom (uploaded) frames. */
	fileName: string;
	/**
	 * blob: URL for a user-uploaded frame image, created eagerly and owned by
	 * the custom-frames registry (src/apps/card-creator/stores/custom-frames.ts).
	 * Absent on stock (manifest) frames, which resolve via `fileName` instead.
	 * Takes precedence over `fileName` when present.
	 */
	objectUrl?: string;
};

// Typing of the auto-generated `cardbacks.json` file, widened to also cover
// user-uploaded custom frames (see card-creator's config/rendering.ts for the
// card-creator-specific CardCreatorCardBack extension).
export type CardBack = {
	id: number;
	name: string;
	type: string;
	dented: boolean;
	/** Absent on stock (manifest) frames. Discriminates user-uploaded frames. */
	source?: "custom";
	/**
	 * Set only on the placeholder produced when a custom frame's id can't be
	 * resolved locally (deleted, not yet imported, etc). This flag is STICKY —
	 * every store action that would replace CardBack must preserve the id and
	 * only re-derive presentation, so a routine save can never clobber the
	 * reference with a stock frame id. See card-storage.ts's
	 * makeMissingFramePlaceholder and card-creator.ts's carryMissingFrame.
	 */
	missing?: true;
	images: CardBackImage[];
};

export function isCustomCardBack(back: CardBack | null | undefined): boolean {
	return back?.source === "custom";
}

// Auto-generated list of cardbacks.
export const CardBacks: CardBack[] = _CardBacks;

/**
 * Maps a CardType to the CardBack.type value(s) that are compatible with it.
 * This mapping is NOT the identity function (e.g. "action" maps to
 * ["general"], "ally" maps to ["token", "hero"]) — any code that needs to
 * find CardBacks (stock OR custom) for a given card type must go through
 * this, not compare `back.type` against the CardType directly, or it will
 * silently find nothing for every type except the handful whose CardType
 * string happens to equal its CardBack.type string.
 */
export function getCardBackTypesForCardType(type: CardType): string[] {
	if (type === "ally") {
		return ["token", "hero"];
	}
	if (
		["equipment", "hero", "weapon", "token", "resource", "event"].includes(type)
	) {
		return [type];
	}
	if (type === "demi_hero") {
		return ["hero"];
	}
	if (type === "weapon_equipment") {
		return ["weapon"];
	}
	return ["general"];
}

export function getCardBacksForTypeAndStyle(
	type: CardType | null,
	style: CardStyle,
): CardBack[] {
	if (type === null) {
		return [];
	}

	// Meld cards have their own dedicated card backs regardless of style
	if (type === "meld") {
		return CardBacks.filter((back) => back.type === "meld");
	}

	const isDented = style === "dented";
	const types = getCardBackTypesForCardType(type);

	return CardBacks.filter(
		(back) => types.includes(back.type) && back.dented === isDented,
	);
}

export function getSuggestedCardBack(
	available: CardBack[],
	cardback: CardBack | null = null,
): CardBack | null {
	if (available.length === 0) return null;

	if (cardback === null) {
		return available[0];
	}

	const exactMatch = available.find((back) => back.name === cardback.name);
	if (exactMatch) {
		return exactMatch;
	}
	// If no exact match, find the most similar name using Levenshtein distance
	let bestMatch = available[0];
	let bestSimilarity = 0;

	for (const back of available) {
		const similarity = stringSimilarity(
			back.name.toLowerCase(),
			cardback.name.toLowerCase(),
		);
		if (similarity > bestSimilarity) {
			bestSimilarity = similarity;
			bestMatch = back;
		}
	}

	return bestMatch;
}

// Helper function to calculate string similarity using Levenshtein distance
function stringSimilarity(
	baseString: string,
	comparisonString: string,
): number {
	// Convert to uppercase for case-insensitive comparison
	const normalizedBaseString = baseString.toUpperCase();
	const normalizedComparisonString = comparisonString.toUpperCase();

	// Calculate Levenshtein distance
	const track = Array(normalizedComparisonString.length + 1)
		.fill(null)
		.map(() => Array(normalizedBaseString.length + 1).fill(null));

	for (let i = 0; i <= normalizedBaseString.length; i++) {
		track[0][i] = i;
	}

	for (let j = 0; j <= normalizedComparisonString.length; j++) {
		track[j][0] = j;
	}

	for (let j = 1; j <= normalizedComparisonString.length; j++) {
		for (let i = 1; i <= normalizedBaseString.length; i++) {
			const indicator =
				normalizedBaseString[i - 1] === normalizedComparisonString[j - 1]
					? 0
					: 1;
			track[j][i] = Math.min(
				track[j][i - 1] + 1, // deletion
				track[j - 1][i] + 1, // insertion
				track[j - 1][i - 1] + indicator, // substitution
			);
		}
	}

	const distance =
		track[normalizedComparisonString.length][normalizedBaseString.length];
	const maxLength = Math.max(
		normalizedBaseString.length,
		normalizedComparisonString.length,
	);

	// Return similarity score (higher is better)
	return 1 - distance / maxLength;
}
