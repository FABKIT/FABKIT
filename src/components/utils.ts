/**
 * Shared Component Utilities
 *
 * Provides field visibility logic for the card creator form.
 * Different card types (hero, action, weapon, etc.) have different
 * visible fields based on their configuration.
 */

import { useMemo } from "react";
import type { CardFormField } from "../config/cards/form_fields.ts";
import { type CardType, CardTypes } from "../config/cards/types.ts";
import { useCardCreator } from "../stores/card-creator.ts";

/**
 * React hook to check if a field should be visible for the current card type.
 * Subscribes to card type changes in the store.
 *
 * @param field - Form field to check (e.g., "CardPower", "CardDefense")
 * @returns true if field should be rendered, false otherwise
 *
 * @example
 * const isPowerVisible = useIsFieldVisible("CardPower");
 * if (!isPowerVisible) return null;
 */
export function useIsFieldVisible(field: CardFormField): boolean {
	const cardType = useCardCreator((state) => state.CardType);

	return useMemo(() => {
		if (!cardType) return false;

		return CardTypes[cardType].fields.includes(field);
	}, [cardType, field]);
}

/**
 * Non-hook version of field visibility check.
 * Used by the store when clearing fields on card type change.
 *
 * @param field - Form field to check
 * @param cardType - Card type to check against (or null)
 * @returns true if field should be visible for this card type
 *
 * @example
 * if (!isFieldVisible("CardDefense", "hero")) {
 *   // Defense field not needed for heroes
 * }
 */
export function isFieldVisible(
	field: CardFormField,
	cardType: CardType | null,
): boolean {
	if (!cardType) return false;

	return CardTypes[cardType].fields.includes(field);
}
