/**
 * Here's where the real magic happens!
 * This file contains the configuration of positioning, scaling, fonts etc of how cards are composed.
 *
 * This stuff gets BIIIIG, and it's not always pretty since it's optimised for performance and accuracy.
 *
 * Here be dragons!
 *
 *                             \||/
 *                             |  @___oo
 *                   /\  /\   / (__,,,,|
 *                  ) /^\) ^\/ _)
 *                  )   /^\/   _)
 *                  )   _ /  / _)
 *              /\  )/\/ ||  | )_)
 *             <  >      |(,,) )__)
 *              ||      /    \)___)\
 *              | \____(      )___) )___
 *               \______(_______;;; __;;;
 *
 */

import type {
	NormalDentedRenderConfig,
	NormalFlatRenderConfig,
} from "./types.ts";

export const NormalDentedRenderConfigPreset: NormalDentedRenderConfig = {
	renderer: "normal",
	variant: "dented",
	viewBox: {
		width: 450,
		height: 628,
	},
	masks: {
		CardArtWork: <rect x="10" y="10" width="430" height="608" fill="white" />,
	},
	clips: {
		Title: <rect x="86" y="40" width="278" height="30" />,
		BottomText: <rect x="105" y="560" width="240" height="25" />,
	},
	elements: {
		CardName: {
			x: 225,
			y: 57,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 25,
			fontWeight: 400,
		},
		CardResource: {
			x: 396.1,
			y: 57,
			fill: "black",
			fontFamily: "palatino_lt_light",
			fontSize: 19,
			fontWeight: 400,
		},
		CardText: {
			x: 55,
			y: 395,
			width: 340,
			height: 160,
		},
		CardPowerImage: {
			x: 30,
			y: 561.2,
			width: 37,
			height: 37,
		},
		CardPowerText: {
			x: 85,
			y: 587,
			fill: "black",
			fontFamily: "palatino_lt_light",
			fontSize: 20.6,
			fontWeight: 400,
		},
		// These values should be the same as CardPowerText
		CardIntellectText: {
			x: 85,
			y: 587,
			fill: "black",
			fontFamily: "palatino_lt_light",
			fontSize: 20.6,
			fontWeight: 400,
		},
		CardDefenseImage: {
			x: 383,
			y: 561.2,
			width: 37,
			height: 37,
		},
		CardDefenseText: {
			x: 362.8,
			y: 587,
			fill: "black",
			fontFamily: "palatino_lt_light",
			fontSize: 17.2,
			fontWeight: 400,
		},
		// These values should be the same as CardDefenseText
		CardLifeText: {
			x: 362.8,
			y: 587,
			fill: "black",
			fontFamily: "palatino_lt_light",
			fontSize: 17.2,
			fontWeight: 400,
		},
		CardBottomText: {
			x: 225,
			y: 575,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 17.6,
			fontWeight: 400,
		},
		CardRarity: {
			x: 114,
			y: 594,
			width: 12,
			height: 12,
		},
		CardFooterTextSingle: {
			x: 225,
			y: 601,
			fill: "white",
			fontFamily: "dialog_cond_semiboldregular, Arial, sans-serif",
			fontSize: 10.43,
			fontWeight: 400,
		},
		CardFooterTextMulti: [
			{
				x: 225,
				y: 601,
				fill: "white",
				fontFamily: "dialog_cond_semiboldregular, Arial, sans-serif",
				fontSize: 10.43,
				fontWeight: 400,
			},
			{
				x: 225,
				y: 611.43,
				fill: "white",
				fontFamily: "dialog_cond_semiboldregular, Arial, sans-serif",
				fontSize: 10.43,
				fontWeight: 400,
			},
		],
	},
};

export const NormalDentedHeroRenderConfigPreset = {
	...NormalDentedRenderConfigPreset,
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};

export const NormalDentedWeaponRenderConfigPreset = {
	...NormalDentedRenderConfigPreset,
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};

export const NormalDentedEquipmentRenderConfigPreset = {
	...NormalDentedRenderConfigPreset,
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};

export const NormalDentedTokenRenderConfigPreset = {
	...NormalDentedRenderConfigPreset,
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};

export const NormalFlatRenderConfigPreset: NormalFlatRenderConfig = {
	renderer: "normal",
	variant: "flat",
	viewBox: {
		width: 450,
		height: 628,
	},
	masks: {
		CardArtWork: <rect x="10" y="10" width="430" height="608" fill="white" />,
	},
	clips: {
		Title: <rect x="86" y="40" width="278" height="30" />,
		BottomText: <rect x="105" y="560" width="240" height="25" />,
	},
	elements: {
		CardName: {
			x: 225,
			y: 57,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 25,
			fontWeight: 400,
		},
		CardResource: {
			x: 396.1,
			y: 57,
			fill: "black",
			fontFamily: "palatino_lt_light",
			fontSize: 19,
			fontWeight: 400,
		},
		CardText: {
			x: 55,
			y: 395,
			width: 340,
			height: 160,
		},
		CardPowerImage: {
			x: 28,
			y: 553.6,
			width: 30,
			height: 30,
		},
		CardPowerText: {
			x: 75.5,
			y: 577,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 17.2,
			fontWeight: 400,
		},
		// These values should be the same as CardPowerText
		CardIntellectText: {
			x: 75.5,
			y: 577,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 17.2,
			fontWeight: 400,
		},
		CardDefenseImage: {
			x: 393,
			y: 553.6,
			width: 30,
			height: 30,
		},
		CardDefenseText: {
			x: 375,
			y: 577,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 17.2,
			fontWeight: 400,
		},
		// These values should be the same as CardDefenseText
		CardLifeText: {
			x: 375,
			y: 577,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 17.2,
			fontWeight: 400,
		},
		CardBottomText: {
			x: 225,
			y: 575,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 17.6,
			fontWeight: 400,
		},
		CardRarity: {
			x: 27.5,
			y: 599.5,
			width: 12.5,
			height: 12.5,
		},
		CardFooterTextLeft: {
			x: 46.4,
			y: 608.75,
			fill: "white",
			fontFamily:
				'dialog_cond_semiboldregular, "Arial Narrow", "Helvetica Condensed", Arial, sans-serif',
			fontSize: 10,
			fontWeight: 400,
			textAnchor: "start",
		},
		CardFooterTextRight: {
			x: 422.5,
			y: 608.75,
			fill: "white",
			fontFamily:
				'dialog_cond_semiboldregular, "Arial Narrow", "Helvetica Condensed", Arial, sans-serif',
			fontSize: 10,
			fontWeight: 400,
			textAnchor: "end",
		},
	},
};

export const NormalFlatHeroRenderConfigPreset = {
	...NormalFlatRenderConfigPreset,
	elements: {
		...NormalFlatRenderConfigPreset.elements,
		CardName: {
			...NormalFlatRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};

export const NormalFlatWeaponRenderConfigPreset = {
	...NormalFlatRenderConfigPreset,
	elements: {
		...NormalFlatRenderConfigPreset.elements,
		CardName: {
			...NormalFlatRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};

export const NormalFlatEquipmentRenderConfigPreset = {
	...NormalFlatRenderConfigPreset,
	elements: {
		...NormalFlatRenderConfigPreset.elements,
		CardName: {
			...NormalFlatRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};

export const NormalFlatTokenRenderConfigPreset = {
	...NormalFlatRenderConfigPreset,
	elements: {
		...NormalFlatRenderConfigPreset.elements,
		CardName: {
			...NormalFlatRenderConfigPreset.elements.CardName,
			x: 225,
			y: 57,
			width: 37,
			height: 37,
		},
	},
};
