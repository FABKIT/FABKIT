/**
 * The public vocabulary of a prefill link: every param an external app may
 * put in a /card-creator URL, and how each one turns into store state.
 *
 * This vocabulary is a published interface and is append-only: a param is
 * never renamed or removed, which is why there is no version param (see
 * docs/adr/0001-prefill-links-use-readable-params.md). It lives in the
 * card-creator app rather than shared/ because it describes this app's
 * surface, not FAB domain data.
 */

import {
	type CardStyle,
	CardStyles,
} from "@fabkit/shared/config/cards/card_styles.ts";
import { CardClasses } from "@fabkit/shared/config/cards/classes.ts";
import {
	type CardFormField,
	CardFormFields,
} from "@fabkit/shared/config/cards/form_fields.ts";
import { CardRarities } from "@fabkit/shared/config/cards/rarities.ts";
import { CardTalents } from "@fabkit/shared/config/cards/talents.ts";
import { type CardType, CardTypes } from "@fabkit/shared/config/cards/types.ts";
import {
	type CardCreatorState,
	HYBRID_SPLIT_MAX,
	HYBRID_SPLIT_MIN,
} from "../stores/card-creator.ts";

/** Why a param in the link did not end up on the card. */
export type IgnoreReason =
	/** Not a param name in this vocabulary. */
	| "unknown_param"
	/** Name is known, value is not one this param accepts. */
	| "invalid_value"
	/** Known param for a field the chosen card type does not show. */
	| "not_on_card_type"
	/** split/blend with no frame2, so nothing they could change is rendered. */
	| "needs_second_frame"
	/** Frame name matches no stock frame for the chosen type and style. */
	| "unknown_frame"
	/** The chosen card type has no frames in the requested style. */
	| "style_unavailable"
	/** Artwork URL could not be fetched (CORS, 404, oversize, timeout). */
	| "artwork_unavailable";

export interface IgnoredParam {
	param: string;
	reason: IgnoreReason;
}

const getFormField = (field: keyof CardCreatorState): CardFormField | null =>
	(CardFormFields as readonly string[]).includes(field)
		? (field as CardFormField)
		: null;

export interface FieldParam {
	/**
	 * The form field whose visibility gates this param, so a link can't set a
	 * value the chosen card type has no place to show. Null for fields every
	 * type shows (artwork credits, set number).
	 */
	formField: CardFormField | null;
	/** Only meaningful on a hybrid card, so pointless without frame2. */
	requiresSecondFrame: boolean;
	/** Writes the value onto the patch; false means the value was unusable. */
	applyTo: (patch: Partial<CardCreatorState>, value: string) => boolean;
}

const defineFieldParam = <K extends keyof CardCreatorState>(
	field: K,
	parse: (value: string) => CardCreatorState[K] | undefined,
	{ requiresSecondFrame = false, formField = getFormField(field) } = {},
): FieldParam => ({
	formField,
	requiresSecondFrame,
	applyTo: (patch, value) => {
		const parsed = parse(value);
		const isUsable = parsed !== undefined;
		if (isUsable) {
			patch[field] = parsed;
		}
		return isUsable;
	},
});

/** Values arrive trimmed and non-empty, so any string is a usable free text. */
const getFreeText = (value: string): string => value;

const getEnumKey =
	<T extends string>(keys: Record<T, unknown>) =>
	(value: string): T | undefined => {
		const key = value.toLowerCase();
		return Object.hasOwn(keys, key) ? (key as T) : undefined;
	};

const getPitch = (value: string): 1 | 2 | 3 | undefined => {
	const pitches = [1, 2, 3] as const;
	return pitches.find((pitch) => String(pitch) === value);
};

const getWeaponHands = (value: string): "(1H)" | "(2H)" | undefined => {
	const hands = { "1h": "(1H)", "2h": "(2H)" } as const;
	return hands[value.toLowerCase() as keyof typeof hands];
};

/**
 * The store holds the seam position and softness as 0..1, but a link author
 * writing "split=0.5" versus "split=50" will guess wrong, so the public unit
 * is a percentage. Out of range is rejected rather than clamped, matching how
 * an out-of-range pitch is treated.
 */
const getPercentageFraction =
	(minPercent: number, maxPercent: number) =>
	(value: string): number | undefined => {
		const percent = Number(value);
		const isInRange =
			Number.isInteger(percent) &&
			percent >= minPercent &&
			percent <= maxPercent;
		return isInRange ? percent / 100 : undefined;
	};

export const FieldParams: Record<string, FieldParam> = {
	name: defineFieldParam("CardName", getFreeText),
	pitch: defineFieldParam("CardPitch", getPitch),
	cost: defineFieldParam("CardResource", getFreeText),
	power: defineFieldParam("CardPower", getFreeText),
	defense: defineFieldParam("CardDefense", getFreeText),
	life: defineFieldParam("CardLife", getFreeText),
	intellect: defineFieldParam("CardHeroIntellect", getFreeText),
	class: defineFieldParam("CardClass", getEnumKey(CardClasses)),
	class2: defineFieldParam("CardSecondaryClass", getEnumKey(CardClasses)),
	talent: defineFieldParam("CardTalent", getEnumKey(CardTalents)),
	subtype: defineFieldParam("CardSubType", getFreeText),
	rarity: defineFieldParam("CardRarity", getEnumKey(CardRarities)),
	weapon: defineFieldParam("CardWeapon", getWeaponHands),
	group: defineFieldParam("CardMacroGroup", getFreeText),
	artist: defineFieldParam("CardArtworkCredits", getFreeText),
	setnumber: defineFieldParam("CardSetNumber", (value) => value.toUpperCase()),
	split: defineFieldParam(
		"CardBackSplit",
		getPercentageFraction(HYBRID_SPLIT_MIN * 100, HYBRID_SPLIT_MAX * 100),
		{ requiresSecondFrame: true },
	),
	blend: defineFieldParam("CardBackBlend", getPercentageFraction(0, 100), {
		requiresSecondFrame: true,
	}),
};

/**
 * Meld is the one card type a link cannot ask for: its state nests two
 * independently composed halves, which a flat param vocabulary has no way to
 * express.
 */
export const getCardTypeParam = (value: string): CardType | undefined => {
	const key = value.toLowerCase();
	const isAddressable = Object.hasOwn(CardTypes, key) && key !== "meld";
	return isAddressable ? (key as CardType) : undefined;
};

export const getCardStyleParam = (value: string): CardStyle | undefined =>
	CardStyles.find((style) => style === value.toLowerCase());

/**
 * Params parsed by parse.ts itself rather than through FieldParams, because
 * they don't map one-to-one onto a store field: type and style decide which
 * frames exist, frame/frame2 resolve against that list, text becomes two
 * fields, and art is fetched in the browser after the patch is applied.
 */
const StructuralParamNames = [
	"type",
	"style",
	"frame",
	"frame2",
	"text",
	"art",
] as const;

/** Every name this vocabulary recognises. Anything else is reported back. */
export const PrefillParamNames: ReadonlySet<string> = new Set([
	...Object.keys(FieldParams),
	...StructuralParamNames,
]);
