import type { CardFormField } from "./form_fields.ts";
import type { CardType } from "./types.ts";

/**
 * Card variants: alternate versions of one card type.
 *
 * A card is described by two coordinates, `CardType` ("what kind of card",
 * e.g. equipment) and `CardVariant` ("which version of it", e.g. Evo action).
 * `CardVariant` is `null` for the standard version of a type, which is every
 * card unless the card type lists variants below. Only card types that appear
 * in `CardVariants` have variants at all.
 *
 * Each variant carries everything that differs from the standard version of
 * its type: what the card prints on its type line, what the variant dropdown
 * calls it, which form fields it shows, which subtypes it offers and which
 * frame families (`CardBack.type`) it can use. Anything a variant does NOT
 * list falls back to the card type's own settings (types.ts, subtypes.ts).
 *
 * Nothing outside this folder should read `CardVariants` directly. Use the
 * helpers in card_definition.ts, which know how type and variant combine. To
 * add a variant, see the "Card Variants" section of
 * src/apps/card-creator/CLAUDE.md.
 */

export interface VariantDefinition {
	/** i18n key for the option shown in the Variant dropdown. */
	uiLabel: string;
	/** i18n key for the card type word printed on the card's type line. */
	printedLabel: string;
	/** Form fields this variant shows (replaces the card type's own list). */
	fields: readonly CardFormField[];
	/** Subtype options this variant offers (replaces the card type's own list). */
	subtypes: Record<string, string>;
	/** Frame families (`CardBack.type`) this variant can use. */
	cardBackTypes: readonly string[];
}

/**
 * Stand-in for "no variant" (`null`) wherever a string is required, such as the
 * option values of the Variant dropdown. It is never stored: callers map it
 * back to `null` before it reaches the store or the serializer.
 *
 * It is reserved: `VariantGroup` rejects it as a variant key at compile time,
 * so it can never collide with a real variant.
 */
export const STANDARD_VARIANT = "standard";

export interface VariantGroup {
	/** i18n key for the Variant dropdown option that means "no variant". */
	standardLabel: string;
	variants: Record<string, VariantDefinition> & {
		[STANDARD_VARIANT]?: never;
	};
}

// Evo equipment is played from hand like an action or instant, then equipped.
// Unlike plain equipment it carries pitch and cost. No Evo equipment prints
// power, life or intellect.
const EVO_EQUIPMENT_FIELDS = [
	"CardPitch",
	"CardName",
	"CardResource",
	"CardText",
	"CardTalent",
	"CardClass",
	"CardSecondaryClass",
	"CardSubType",
	"CardRarity",
	"CardDefense",
] as const satisfies readonly CardFormField[];

const EVO_EQUIPMENT_SUBTYPES = {
	none: "card.subtype.none",
	evo_head: "card.subtype.evo_head",
	evo_chest: "card.subtype.evo_chest",
	evo_arms: "card.subtype.evo_arms",
	evo_legs: "card.subtype.evo_legs",
	evo_base_head: "card.subtype.evo_base_head",
	evo_base_chest: "card.subtype.evo_base_chest",
	evo_base_arms: "card.subtype.evo_base_arms",
	evo_base_legs: "card.subtype.evo_base_legs",
} as const satisfies Record<string, string>;

export const CardVariants = {
	equipment: {
		standardLabel: "card.variant.equipment_normal",
		variants: {
			evo_action: {
				uiLabel: "card.variant.action_equipment_evo",
				printedLabel: "card.type.action_equipment",
				fields: EVO_EQUIPMENT_FIELDS,
				subtypes: EVO_EQUIPMENT_SUBTYPES,
				// Evo frames are their own family in the frame manifest, not
				// the plain "equipment" family.
				cardBackTypes: ["evo"],
			},
			evo_instant: {
				uiLabel: "card.variant.instant_equipment_evo",
				printedLabel: "card.type.instant_equipment",
				fields: EVO_EQUIPMENT_FIELDS,
				subtypes: EVO_EQUIPMENT_SUBTYPES,
				cardBackTypes: ["evo"],
			},
		},
	},
} satisfies Partial<Record<CardType, VariantGroup>>;

/**
 * Every variant key across every card type, derived from `CardVariants` above
 * rather than written out by hand, so adding a variant there is enough.
 * Variant keys are saved in card files and share links, so never rename one.
 * `STANDARD_VARIANT` is excluded: it means "no variant", which is `null`.
 */
export type CardVariant = Exclude<
	{
		[T in keyof typeof CardVariants]: keyof (typeof CardVariants)[T]["variants"];
	}[keyof typeof CardVariants],
	typeof STANDARD_VARIANT
>;

/**
 * A variant, or `STANDARD_VARIANT` for "no variant". Use it only where a
 * string must stand in for `null` (e.g. dropdown option values); comparing
 * against `STANDARD_VARIANT` narrows it back to `CardVariant`.
 */
export type CardVariantOrStandard = CardVariant | typeof STANDARD_VARIANT;
