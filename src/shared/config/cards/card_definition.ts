import type { CardFormField } from "./form_fields.ts";
import { CardSubtypes } from "./subtypes.ts";
import { type CardType, CardTypes } from "./types.ts";
import {
	type CardVariant,
	CardVariants,
	type VariantDefinition,
	type VariantGroup,
} from "./variants.ts";

/**
 * The single place that knows how a card type and its variant combine.
 * Components and stores ask through these helpers instead of reading
 * `CardTypes`, `CardSubtypes` or `CardVariants`. A `null` variant, or one the
 * type doesn't have, falls back to the type's own settings.
 */

// CardVariants has literal keys; widen so it can be indexed by CardType.
const VARIANT_GROUPS: Partial<Record<CardType, VariantGroup>> = CardVariants;

const CARD_TYPE_KEYS: ReadonlySet<string> = new Set(Object.keys(CardTypes));

/** A card type together with one of its variants (`null` = standard version). */
export interface CardKind {
	type: CardType;
	variant: CardVariant | null;
}

/** Makes an untrusted value safe as a card type: unknown becomes "action", null/undefined become null. */
export function normalizeCardType(value: unknown): CardType | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "string" && CARD_TYPE_KEYS.has(value)) {
		return value as CardType;
	}
	return "action";
}

/** The variant's settings, or `null` for the standard version or an unknown variant. */
export function getVariantDefinition(
	type: CardType,
	variant: CardVariant | null,
): VariantDefinition | null {
	if (variant === null) return null;
	const group = VARIANT_GROUPS[type];
	// hasOwn, not `in` or a plain lookup: a hand-edited file saying
	// "constructor" must not match something on the object prototype.
	if (!group || !Object.hasOwn(group.variants, variant)) return null;
	return group.variants[variant];
}

/** `null` (the standard version) is valid for every card type. */
export function isValidVariantForType(
	type: CardType,
	variant: CardVariant | null,
): boolean {
	return variant === null || getVariantDefinition(type, variant) !== null;
}

/** The variant if the card type really has it, otherwise `null`. */
export function normalizeVariant(
	type: CardType,
	variant: CardVariant | null,
): CardVariant | null {
	return isValidVariantForType(type, variant) ? variant : null;
}

/** i18n key for the card type word printed on the card's type line. */
export function getCardTypeLabel(
	type: CardType,
	variant: CardVariant | null,
): string {
	return (
		getVariantDefinition(type, variant)?.printedLabel ?? CardTypes[type].label
	);
}

/** Form fields shown for this card. */
export function getCardFields(
	type: CardType,
	variant: CardVariant | null,
): readonly CardFormField[] {
	return (
		getVariantDefinition(type, variant)?.fields ??
		(CardTypes[type].fields as readonly CardFormField[])
	);
}

/** Subtype options (key to i18n key) offered for this card. */
export function getCardSubtypes(
	type: CardType,
	variant: CardVariant | null,
): Record<string, string> {
	return getVariantDefinition(type, variant)?.subtypes ?? CardSubtypes[type];
}

/** Variant dropdown options: standard first, then variants in listed order. Empty if the type has none. */
export function getVariantOptions(
	type: CardType,
): { variant: CardVariant | null; label: string }[] {
	const group = VARIANT_GROUPS[type];
	if (!group) return [];
	return [
		{ variant: null, label: group.standardLabel },
		...Object.entries(group.variants).map(([key, definition]) => ({
			variant: key as CardVariant,
			label: definition.uiLabel,
		})),
	];
}

/** Every card type with `null`, plus every variant of the types that have any. */
export function getAllCardKinds(): CardKind[] {
	const kinds: CardKind[] = [];
	for (const type of Object.keys(CardTypes) as CardType[]) {
		kinds.push({ type, variant: null });
		const group = VARIANT_GROUPS[type];
		if (!group) continue;
		for (const key of Object.keys(group.variants)) {
			kinds.push({ type, variant: key as CardVariant });
		}
	}
	return kinds;
}
