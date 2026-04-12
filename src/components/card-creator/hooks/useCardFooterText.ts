/**
 * Card Footer Text Hook
 *
 * Generates footer text that appears at the bottom of cards.
 * Layout and format depend on card back style (flat vs dented).
 *
 * ## Flat Card Footer
 * Returns array [left, right]:
 * - Left: "SET001 | FABKIT | ARTIST NAME"
 * - Right: "FaB TCC BY LSS"
 *
 * ## Dented Card Footer
 * Returns string or array [line1, line2]:
 * - If no custom fields: Single line "FABKIT - NOT LEGAL - FLESH AND BLOOD TCG BY LLS"
 * - If custom fields: Two lines with set/artist on top, legal disclaimer below
 *
 * ## Legal Disclaimer
 * All FABKIT cards include "NOT LEGAL" text to indicate they're custom/unofficial.
 */

import { useMemo } from "react";
import { useCardCreator } from "../../../stores/card-creator.ts";

/**
 * Computes footer text based on card back style and custom fields.
 *
 * @returns Single string (dented single-line) or [string, string] tuple (multi-line/split)
 */
export function useCardFooterText(): string | [string, string] {
	const CardBackStyle = useCardCreator((state) => state.CardBackStyle);
	const CardSetNumber = useCardCreator((state) => state.CardSetNumber);
	const CardArtworkCredits = useCardCreator(
		(state) => state.CardArtworkCredits,
	);

	return useMemo(() => {
		if (CardBackStyle === "dented") {
			return generateDentedFooterText(CardSetNumber, CardArtworkCredits);
		}

		return generateFlatFooterText(CardSetNumber, CardArtworkCredits);
	}, [CardSetNumber, CardArtworkCredits, CardBackStyle]);
}

/**
 * Generates footer text for dented card backs.
 *
 * @param CardSetNumber - Set number (e.g., "MON001") or null
 * @param CardArtworkCredits - Artist name or null
 * @returns Single centered string or two stacked centered lines
 */
function generateDentedFooterText(
	CardSetNumber: string | null,
	CardArtworkCredits: string | null,
): string | [string, string] {
	if (CardSetNumber === null && CardArtworkCredits === null) {
		return "FABKIT - NOT LEGAL - FLESH AND BLOOD TCG BY LLS";
	}

	if (CardSetNumber === null) {
		return [
			`FABKIT - ${CardArtworkCredits}`,
			"NOT LEGAL - FLESH AND BLOOD TCG BY LLS",
		];
	} else if (CardArtworkCredits === null) {
		return [
			`${CardSetNumber} - FABKIT`,
			"NOT LEGAL - FLESH AND BLOOD TCG BY LLS",
		];
	}

	return [
		`${CardSetNumber} - FABKIT - ${CardArtworkCredits}`,
		"NOT LEGAL - FLESH AND BLOOD TCG BY LLS",
	];
}

/**
 * Generates footer text for flat card backs.
 *
 * @param CardSetNumber - Set number (e.g., "MON001") or null
 * @param CardArtworkCredits - Artist name or null
 * @returns Always returns [left, right] tuple for split footer layout
 */
function generateFlatFooterText(
	CardSetNumber: string | null,
	CardArtworkCredits: string | null,
): [string, string] {
	return [
		[CardSetNumber, "FABKIT", CardArtworkCredits]
			.filter((value) => value?.trim()?.length)
			.join(" | "),
		"FaB TCC BY LSS",
	];
}
