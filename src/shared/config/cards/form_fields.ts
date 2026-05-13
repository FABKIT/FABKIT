// The name of each form field available in the card creator form.

import type { CardClass } from "./classes.ts";
import type { CardRarity } from "./rarities.ts";
import type { CardTalent } from "./talents.ts";

export const CardFormFields = [
	"CardPitch",
	"CardName",
	"CardResource",
	"CardPower",
	"CardText",
	"CardTalent",
	"CardClass",
	"CardSecondaryClass",
	"CardSubType",
	"CardRarity",
	"CardDefense",
	"CardLife",
	"CardHeroIntellect",
	"CardWeapon",
	"CardMacroGroup",
] as const;

export type CardFormField = (typeof CardFormFields)[number];

// Maps each form field to its specific type
export type CardFormFieldValue = {
	CardPitch: 1 | 2 | 3;
	CardName: string;
	CardResource: string;
	CardText: string;
	CardPower: string;
	CardTalent: CardTalent | string;
	CardClass: CardClass | string;
	CardSecondaryClass: CardClass | string;
	CardSubType: string;
	CardRarity: CardRarity;
	CardDefense: string;
	CardLife: string;
	CardHeroIntellect: string;
	CardWeapon: "(1H)" | "(2H)";
	CardMacroGroup: string;
};
