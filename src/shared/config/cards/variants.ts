import type { CardFormField } from "./form_fields.ts";
import type { CardType } from "./types.ts";

/**
 * Card variants: alternate versions of one card type (e.g. Evo equipment).
 * `CardVariant` is `null` for the standard version. Each variant carries what
 * differs from its type's own settings; use the helpers in card_definition.ts
 * rather than reading `CardVariants` directly.
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
 * Stand-in for `null` where a string is required (dropdown option values).
 * Never stored. Reserved: `VariantGroup` rejects it as a variant key.
 */
export const STANDARD_VARIANT = "standard";

export interface VariantGroup {
	/** i18n key for the Variant dropdown option that means "no variant". */
	standardLabel: string;
	variants: Record<string, VariantDefinition> & {
		[STANDARD_VARIANT]?: never;
	};
}

// Unlike plain equipment, Evo equipment carries pitch and cost.
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
 * Every variant key across every card type. Keys are saved in card files and
 * share links, so never rename one.
 */
export type CardVariant = Exclude<
	{
		[T in keyof typeof CardVariants]: keyof (typeof CardVariants)[T]["variants"];
	}[keyof typeof CardVariants],
	typeof STANDARD_VARIANT
>;

/** A variant, or `STANDARD_VARIANT` where a string must stand in for `null`. */
export type CardVariantOrStandard = CardVariant | typeof STANDARD_VARIANT;
