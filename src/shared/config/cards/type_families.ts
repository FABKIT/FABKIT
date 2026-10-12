import { type CardType, CardTypes } from "./types.ts";

/**
 * Groups card types into family + variant for the card type selector.
 *
 * PRESENTATION ONLY. The chosen variant is still stored in the single
 * `CardType` field (card-creator.ts's store, SerializedCardState, the
 * share-link contract, everything) — there is no separate stored "variant"
 * concept anywhere. A family's variants ARE CardTypes; this file only
 * decides how they are grouped and labelled in the UI.
 *
 * `label` here is the UI label shown in the selector (e.g.
 * "Action Equipment (EVO)"). The PRINTED type-line text on the card itself
 * stays on `CardTypes[type].label` (e.g. "Action Equipment") — the two are
 * deliberately different strings so the dropdown can be more descriptive
 * than what's actually printed on the card.
 */
export const CardTypeFamilies = {
	equipment: {
		label: "card.family.equipment",
		variants: [
			{ type: "equipment", label: "card.variant.equipment_normal" },
			{ type: "action_equipment", label: "card.variant.action_equipment_evo" },
			{
				type: "instant_equipment",
				label: "card.variant.instant_equipment_evo",
			},
		],
	},
} satisfies Record<
	string,
	{
		label: string;
		variants: readonly { type: CardType; label: string }[];
	}
>;

export type CardTypeFamily = keyof typeof CardTypeFamilies;

/** Reverse lookup: which family (if any) a given CardType belongs to. */
export function getFamilyForCardType(type: CardType): CardTypeFamily | null {
	for (const family of Object.keys(CardTypeFamilies) as CardTypeFamily[]) {
		if (
			CardTypeFamilies[family].variants.some((variant) => variant.type === type)
		) {
			return family;
		}
	}
	return null;
}

/**
 * The variant a family switches to when the family itself is chosen in the
 * top-level selector — always the family's first listed variant.
 */
export function getDefaultVariantForFamily(family: CardTypeFamily): CardType {
	return CardTypeFamilies[family].variants[0].type;
}

/** One entry in the top-level card type selector: either a family (which
 * expands into a second variant dropdown) or a standalone card type. */
export type TypeSelectorEntry =
	| { kind: "family"; family: CardTypeFamily; label: string }
	| { kind: "type"; type: CardType; label: string };

/**
 * The full top-level list: one entry per family, plus one entry per card
 * type that belongs to no family. Returns i18n keys — callers translate and
 * sort by the TRANSLATED label, not by these keys, since family keys and
 * card type keys don't share an ordering.
 */
export function getTypeSelectorEntries(): TypeSelectorEntry[] {
	const typesInFamilies = new Set<CardType>();
	for (const family of Object.values(CardTypeFamilies)) {
		for (const variant of family.variants) {
			typesInFamilies.add(variant.type);
		}
	}

	const entries: TypeSelectorEntry[] = Object.keys(CardTypeFamilies).map(
		(family) => ({
			kind: "family",
			family: family as CardTypeFamily,
			label: CardTypeFamilies[family as CardTypeFamily].label,
		}),
	);

	for (const type of Object.keys(CardTypes) as CardType[]) {
		if (!typesInFamilies.has(type)) {
			entries.push({ kind: "type", type, label: CardTypes[type].label });
		}
	}

	return entries;
}
