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
 *
 * Everything the app asks about a card ("which fields?", "which subtypes?",
 * "which frames?", "what is printed on the type line?") depends on BOTH
 * `CardType` and `CardVariant`. Components and stores must ask through these
 * helpers instead of reading `CardTypes`, `CardSubtypes` or `CardVariants`
 * themselves, so a variant can never be forgotten at a call site.
 *
 * A `variant` of `null` means the standard version of the type. Every helper
 * falls back to the card type's own settings in that case, and also when the
 * variant is not one the type actually has.
 */

// CardVariants is typed by its literal keys, which can't be indexed with a
// plain CardType. Widen it once here.
const VARIANT_GROUPS: Partial<Record<CardType, VariantGroup>> = CardVariants;

const CARD_TYPE_KEYS: ReadonlySet<string> = new Set(Object.keys(CardTypes));

/** A card type together with one of its variants (`null` = standard version). */
export interface CardKind {
	type: CardType;
	variant: CardVariant | null;
}

/**
 * Makes an untrusted value (a saved card, an imported file, a bug report)
 * safe to use as a card type. Unknown types become "action" instead of
 * crashing the editor when its config can't be found. `null` and `undefined`
 * stay `null`, meaning "no card type chosen".
 */
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

/**
 * Options for the Variant dropdown of a card type: the standard version first
 * (`variant: null`), then each variant in the order it's listed in
 * variants.ts. Empty for a card type with no variants, which is also what
 * tells the editor not to show the dropdown (check `.length > 0`).
 */
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
