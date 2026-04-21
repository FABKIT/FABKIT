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
	// Stops just before CardText.y (400) — the lowest text-box top across all dented variants
	artworkDragZone: { x: 10, y: 10, width: 430, height: 385 },
	masks: {
		CardArtWork: <rect x="10" y="10" width="430" height="608" fill="white" />,
	},
	clips: {
		Title: <rect x="86" y="40" width="278" height="30" />,
		BottomText: <rect x="105" y="560" width="240" height="25" />,
	},
	elements: {
		CardName: {
			x: 224.6,
			y: 58.5,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 25,
			fontWeight: 400,
			maxWidth: 270,
			scaledY: 57.75,
		},
		CardResource: {
			x: 396,
			y: 57.35,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 17.9,
			fontWeight: 400,
			stroke: "#C42025",
			strokeWidth: 2,
			paintOrder: "stroke",
		},
		CardText: {
			x: 55,
			y: 400,
			width: 341,
			height: 149.5,
			fontSize: 17.65,
			minFontSize: 6,
			overflowScalingFactor: 0.994,
			italicFontSize: 0.969,
		},
		CardPowerImage: {
			x: 30,
			y: 561.2,
			width: 37,
			height: 37,
		},
		CardPowerText: {
			x: 85.65,
			y: 587.8,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 20.6,
			fontWeight: 400,
		},
		// These values should be the same as CardPowerText
		CardIntellectText: {
			x: 85.65,
			y: 587.8,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
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
			x: 364.4,
			y: 587.8,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 20.6,
			fontWeight: 400,
		},
		// These values should be the same as CardDefenseText
		CardLifeText: {
			x: 364.4,
			y: 587.8,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 20.6,
			fontWeight: 400,
		},
		CardBottomText: {
			x: 224.8,
			y: 575.6,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 17.4,
			fontWeight: 400,
			maxWidth: 218,
			scaledY: 573.85,
		},
		CardRarity: {
			x: 120.5,
			y: 595,
			width: 11.2,
			height: 11.2,
		},
		CardFooterTextSingle: {
			x: 229.9,
			y: 601.25,
			fill: "white",
			fontFamily: "dialog_cond_semiboldregular, Arial, sans-serif",
			fontSize: 10.38,
			fontWeight: 400,
		},
		CardFooterTextMulti: [
			{
				x: 229.9,
				y: 601,
				fill: "white",
				fontFamily: "dialog_cond_semiboldregular, Arial, sans-serif",
				fontSize: 10.43,
				fontWeight: 400,
			},
			{
				x: 229.9,
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
	clips: {
		...NormalDentedRenderConfigPreset.clips,
		Title: <rect x="58" y="40" width="334" height="30" />,
	},
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 224.9,
			y: 55,
			fontSize: 28,
			maxWidth: 333,
			scaledY: 54.3,
		},
		CardText: {
			x: 55.4,
			y: 412,
			width: 340,
			height: 123.5,
			fontSize: 17.6,
			minFontSize: 6,
			overflowScalingFactor: 0.978,
		},
	},
};

export const NormalDentedWeaponRenderConfigPreset = {
	...NormalDentedRenderConfigPreset,
	clips: {
		...NormalDentedRenderConfigPreset.clips,
		Title: <rect x="58" y="40" width="334" height="30" />,
	},
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 224.8,
			y: 54.9,
			fontSize: 28.8,
			maxWidth: 333,
			scaledY: 53.48,
		},
		CardText: {
			x: 53.5,
			y: 404.5,
			width: 343,
			height: 140,
			fontSize: 17.5,
			minFontSize: 6,
			overflowScalingFactor: 0.969,
		},
	},
};

export const NormalDentedEquipmentRenderConfigPreset = {
	...NormalDentedRenderConfigPreset,
	clips: {
		...NormalDentedRenderConfigPreset.clips,
		Title: <rect x="58" y="40" width="334" height="30" />,
	},
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 224.8,
			y: 54.9,
			fontSize: 28.8,
			maxWidth: 333,
			scaledY: 53.48,
		},
		CardText: {
			x: 53.5,
			y: 404.5,
			width: 343,
			height: 140,
			fontSize: 17.5,
			minFontSize: 6,
			overflowScalingFactor: 0.969,
		},
	},
};

export const NormalDentedTokenRenderConfigPreset = {
	...NormalDentedRenderConfigPreset,
	elements: {
		...NormalDentedRenderConfigPreset.elements,
		CardName: {
			...NormalDentedRenderConfigPreset.elements.CardName,
			x: 224.8,
			y: 54.9,
			fontSize: 28.8,
			maxWidth: 333,
			scaledY: 53.48,
		},
		CardText: {
			x: 53,
			y: 407,
			width: 342,
			height: 136,
			fontSize: 17.85,
			minFontSize: 6,
			overflowScalingFactor: 0.98,
			italicFontSize: 0.965,
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
	// Stops just before CardText.y (~392) — the lowest text-box top across all flat variants
	artworkDragZone: { x: 10, y: 10, width: 430, height: 380 },
	masks: {
		CardArtWork: <rect x="10" y="10" width="430" height="608" fill="white" />,
	},
	clips: {
		Title: <rect x="86" y="40" width="278" height="30" />,
		BottomText: <rect x="105" y="560" width="240" height="25" />,
	},
	elements: {
		CardName: {
			x: 225.5,
			y: 58,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 24.5,
			fontWeight: 400,
			maxWidth: 260,
			scaledY: 57.2,
		},
		CardResource: {
			x: 397.6,
			y: 57.1,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 17.9,
			fontWeight: 400,
			stroke: "#C42025",
			strokeWidth: 2,
			paintOrder: "stroke",
		},
		CardText: {
			x: 54,
			y: 393,
			width: 344,
			height: 143.5,
			fontSize: 17.84,
			minFontSize: 6,
			overflowScalingFactor: 0.99,
		},
		CardPowerImage: {
			x: 28.4,
			y: 554,
			width: 30,
			height: 30,
		},
		CardPowerText: {
			x: 76.1,
			y: 577,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 16.7,
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
			x: 392.5,
			y: 554,
			width: 30,
			height: 30,
		},
		CardDefenseText: {
			x: 375,
			y: 577,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 16.7,
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
			x: 225.25,
			y: 575.3,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 17.7,
			fontWeight: 400,
			maxWidth: 223,
			scaledY: 574.15,
		},
		CardRarity: {
			x: 27.6,
			y: 596.8,
			width: 11.6,
			height: 11.6,
		},
		CardFooterTextLeft: {
			x: 45.8,
			y: 603,
			fill: "white",
			fontFamily:
				'dialog_cond_semiboldregular, "Arial Narrow", "Helvetica Condensed", Arial, sans-serif',
			fontSize: 10.8,
			fontWeight: 400,
			textAnchor: "start",
		},
		CardFooterTextRight: {
			x: 423.1,
			y: 603.7,
			fill: "white",
			fontFamily:
				'dialog_cond_semiboldregular, "Arial Narrow", "Helvetica Condensed", Arial, sans-serif',
			fontSize: 10.8,
			fontWeight: 400,
			textAnchor: "end",
		},
	},
};

export const NormalFlatHeroRenderConfigPreset = {
	...NormalFlatRenderConfigPreset,
	clips: {
		...NormalFlatRenderConfigPreset.clips,
		Title: <rect x="67" y="40" width="316" height="30" />,
	},
	elements: {
		...NormalFlatRenderConfigPreset.elements,
		CardName: {
			...NormalFlatRenderConfigPreset.elements.CardName,
			x: 225.2,
			y: 53.6,
			fontSize: 28.8,
			maxWidth: 315,
			scaledY: 52.3,
		},
		CardText: {
			x: 54,
			y: 392.4,
			width: 342,
			height: 145,
			fontSize: 17.71,
			minFontSize: 6,
			overflowScalingFactor: 0.977,
		},
	},
};

export const NormalFlatWeaponRenderConfigPreset = {
	...NormalFlatRenderConfigPreset,
	clips: {
		...NormalFlatRenderConfigPreset.clips,
		Title: <rect x="67" y="40" width="316" height="30" />,
	},
	elements: {
		...NormalFlatRenderConfigPreset.elements,
		CardName: {
			...NormalFlatRenderConfigPreset.elements.CardName,
			x: 225,
			y: 53.4,
			fontSize: 29.1,
			maxWidth: 315,
			scaledY: 53,
		},
		CardText: {
			x: 54,
			y: 392.7,
			width: 342,
			height: 144.5,
			fontSize: 17,
			minFontSize: 6,
			overflowScalingFactor: 0.987,
		},
	},
};

export const NormalFlatEquipmentRenderConfigPreset = {
	...NormalFlatRenderConfigPreset,
	clips: {
		...NormalFlatRenderConfigPreset.clips,
		Title: <rect x="67" y="40" width="316" height="30" />,
	},
	elements: {
		...NormalFlatRenderConfigPreset.elements,
		CardName: {
			...NormalFlatRenderConfigPreset.elements.CardName,
			x: 225,
			y: 53.4,
			fontSize: 29.1,
			maxWidth: 315,
			scaledY: 53,
		},
		CardText: {
			x: 54,
			y: 392.7,
			width: 342,
			height: 144.5,
			fontSize: 16.8,
			minFontSize: 6,
			overflowScalingFactor: 0.987,
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
			y: 53.4,
			fontSize: 29.1,
			maxWidth: 315,
			scaledY: 53,
		},
		CardText: {
			x: 54,
			y: 400,
			width: 340,
			height: 130,
			fontSize: 17.8,
			minFontSize: 6,
		},
	},
};
