/**
 * Card Bottom Text Hook
 *
 * Generates the bottom center text on cards that displays talent, class,
 * card type, and subtype information.
 *
 * ## Format Examples
 *
 * - "Light Warrior Action - Attack"
 * - "Draconic Illusionist Hero"
 * - "Ninja Action - Attack Reaction (2H)"
 * - "Equipment - Arms"
 *
 * ## Assembly Logic
 *
 * Combines (in order, space-separated):
 * 1. Talent (if present and not "none")
 * 2. Class(es) - space separator for heroes, " / " for others
 * 3. Card type
 * 4. Subtype (if present) prefixed with "-"
 * 5. Weapon hand (for weapon types) like "(1H)" or "(2H)"
 *
 * All text is localized via i18next.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type CardClass, CardClasses } from "../../../config/cards/classes.ts";
import { CardSubtypes } from "../../../config/cards/subtypes.ts";
import { type CardTalent, CardTalents } from "../../../config/cards/talents.ts";
import { CardTypes } from "../../../config/cards/types.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";

/**
 * Computes the bottom center text for a card based on current state.
 * Automatically handles talent, class, type, and subtype combinations.
 *
 * @returns Formatted bottom text string (e.g., "Light Warrior Action - Attack")
 */
export function useCardBottomText() {
	const { t } = useTranslation();
	const {
		CardTalent,
		CardType,
		CardClass,
		CardSecondaryClass,
		CardSubType,
		CardWeapon,
	} = useCardCreator();

	return useMemo(() => {
		// Translate talent if present
		const talent =
			CardTalent && CardTalent !== "none"
				? t(CardTalents[CardTalent as CardTalent]) || CardTalent
				: null;

		// Translate primary class if present
		const primaryClass =
			CardClass && CardClass !== "none"
				? t(CardClasses[CardClass as CardClass]) || CardClass
				: null;

		const secondaryClass =
			CardSecondaryClass && CardSecondaryClass !== "none"
				? t(CardClasses[CardSecondaryClass as CardClass]) || CardSecondaryClass
				: null;

		// Handle class combination with a proper separator
		// Heroes use space separator, others use "/"
		const isHero = CardType === "hero" || CardType === "demi_hero";
		const separator = isHero ? " " : " / ";

		const classText =
			primaryClass && secondaryClass
				? `${primaryClass}${separator}${secondaryClass}`
				: primaryClass;

		// Translate a card type
		const cardType = CardType ? t(CardTypes[CardType].label) : null;

		// Build subtype portion
		const subtypeParts: string[] = [];

		// Add a translated subtype if present
		if (CardType && CardSubType && CardSubType !== "none") {
			const subtypeKey = CardSubtypes[CardType]?.[CardSubType] || CardSubType;
			if (subtypeKey) {
				subtypeParts.push(t(subtypeKey));
			}
		}

		// Add weapon suffix for weapon types
		if (
			(CardType === "weapon" || CardType === "weapon_equipment") &&
			CardWeapon
		) {
			subtypeParts.push(CardWeapon); // Already in format "(1H)" or "(2H)"
		}

		const subtypeText =
			subtypeParts.length > 0 ? `- ${subtypeParts.join(" ")}` : null;

		// Assemble the final string
		return [talent, classText, cardType, subtypeText]
			.filter((part): part is string => Boolean(part))
			.join(" ");
	}, [
		CardTalent,
		CardClass,
		CardSecondaryClass,
		CardType,
		CardSubType,
		CardWeapon,
		t,
	]);
}
