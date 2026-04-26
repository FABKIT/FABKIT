import _CardBacks from "../../../public/cardbacks/cardbacks.json";
import type { RenderConfigVariation } from "../rendering.ts";
import type { CardStyle } from "./card_styles.ts";
import type { CardType } from "./types.ts";

// Typing of the auto-generated `cardbacks.json` file.
export type CardBack = {
	id: number;
	name: string;
	type: string;
	dented: boolean;
	renderer: RenderConfigVariation;
	images: {
		id: number;
		pitch: number;
		fileName: string;
	}[];
};

// Auto-generated list of cardbacks.
export const CardBacks: CardBack[] = _CardBacks;

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
	let types = ["general"];
	if (type === "ally") {
		types = ["token", "hero"];
	} else if (
		type !== null &&
		[
			"equipment",
			"hero",
			"equipment",
			"weapon",
			"token",
			"resource",
			"event",
		].includes(type)
	) {
		types = [type];
	} else if (type === "demi_hero") {
		types = ["hero"];
	} else if (type === "weapon_equipment") {
		types = ["weapon"];
	}

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
