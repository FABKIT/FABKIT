/**
 * Meld Card Render Configuration Preset
 *
 * Landscape SVG (628×450) split into two upright half-cards side by side:
 *
 *   x=0   ──── Left half (Half A) ────   x=306
 *   x=306 ─── Centre strip (16px) ───   x=322
 *   x=322 ─── Right half (Half B) ────   x=628
 *
 * rightHalfStart = leftHalfWidth(312) + centerGap(4) = 316
 * MeldRenderer offsets right-half per-half coords via bX(x) = 316 + x.
 * Clip paths are generated in MeldRenderer from half.CardName and half.CardBottomText
 * width/height values — no hardcoded clip JSX needed in the preset.
 *
 * Vertical layout per half (matches the card-back template):
 *   y=0–14    outer border
 *   y=14–266  artwork window
 *   y=266–296 Meld band ("Meld (…)" keyword text)
 *   y=296–404 body text box
 *   y=404–420 type / class line + rarity icon
 *   y=420–450 footer + bottom pearls
 *
 * Corner stats (shared, absolute SVG coords):
 *   top-left   (28, 42)   — pitch orb + resource cost (left half)
 *   top-right  (600, 42)  — pitch orb + resource cost (right half)
 *   bottom-left  (32, 404) — power
 *   bottom-right (596, 404) — defense / life
 */

import type { MeldCardRenderConfig } from "./types.ts";

export const MeldFlatRenderConfigPreset: MeldCardRenderConfig = {
	renderer: "meld",
	viewBox: {
		width: 628,
		height: 450,
	},

	leftHalfWidth: 312,
	centerGap: 4,

	// artworkDragZone is unused for meld — per-half zones are used instead.
	artworkDragZone: { x: 0, y: 0, width: 0, height: 0 },

	/** Artwork drag zone for Half A (left half, absolute SVG coords) */
	leftArtworkDragZone: { x: 28, y: 56, width: 286, height: 243 },

	/** Artwork drag zone for Half B (right half, absolute SVG coords). bX(28)=350. */
	rightArtworkDragZone: { x: 314, y: 56, width: 286, height: 243 },

	masks: {
		// Artwork luminance masks — constrain each artwork to its window.
		LeftArtWork: <rect x="28" y="56" width="286" height="243" fill="white" />,
		RightArtWork: <rect x="314" y="56" width="286" height="243" fill="white" />,
	},

	// Clip paths for CardName and CardBottomText are generated in MeldRenderer
	// from half.CardName.width/height and half.CardBottomText.width/height.
	clips: {},

	/**
	 * Per-half element positions (x=0 is the left edge of whichever half).
	 * Half dimensions: 306 wide × 450 tall.
	 * MeldRenderer uses these as-is for the left half; adds rightHalfStart(322)
	 * via bX() for the right half.
	 *
	 * CardName      — centred in the title banner (y≈42)
	 * CardText      — inside the beige body text box (y=305–385)
	 * CardBottomText — talent · class · type line (y≈400)
	 */
	half: {
		CardName: {
			x: 187,
			y: 48,
			width: 211,
			height: 18.5,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 20,
			fontWeight: 400,
			maxWidth: 226,
			scaledY: 41.5,
		},
		CardText: {
			x: 47,
			y: 313,
			width: 248,
			height: 66,
			fontSize: 14,
			minFontSize: 4,
			overflowScalingFactor: 0.99,
		},
		CardBottomText: {
			x: 191.5,
			y: 403.5,
			width: 215,
			height: 18,
			fill: "black",
			fontFamily: "amanda_std_regular",
			fontSize: 12.7,
			fontWeight: 400,
			maxWidth: 200,
			scaledY: 399.5,
		},
	},

	/**
	 * Shared elements — positioned in absolute SVG coordinates.
	 * Rendered once regardless of which half is active.
	 *
	 * Cost / Pitch    → single instance at CardResource position
	 * Power/Intellect → bottom-left corner pearl — Intellect reuses the power pearl image
	 * Defense/Life    → bottom-right corner pearl — Life reuses the defense pearl image
	 * CardRarity      → small icon left of the type line on the left half
	 * MeldBandText    → horizontal Meld band
	 * Footer          → outer edges
	 */
	shared: {
		CardResource: {
			x: 584.5,
			y: 45.7,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 12,
			fontWeight: 400,
			stroke: "#C42025",
			strokeWidth: 1.5,
			paintOrder: "stroke",
		},
		CardPowerImage: {
			x: 26,
			y: 387,
			width: 21,
			height: 21,
		},
		CardPowerText: {
			x: 59.5,
			y: 403,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 12.5,
			fontWeight: 400,
		},
		CardDefenseImage: {
			x: 581,
			y: 387,
			width: 21,
			height: 21,
		},
		CardDefenseText: {
			x: 568.5,
			y: 403,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 12.5,
			fontWeight: 400,
		},
		CardLifeText: {
			x: 569,
			y: 402,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 12.5,
			fontWeight: 400,
		},
		CardIntellectText: {
			x: 59.5,
			y: 403,
			fill: "black",
			fontFamily: "palatino_lt_stdroman",
			fontSize: 12.5,
			fontWeight: 400,
		},
		CardRarity: {
			x: 26.7,
			y: 418.5,
			width: 12,
			height: 12,
		},
		// "Meld" renders in palatino_lt_stdbold; description in palatino_lt_italic.
		// fontFamily/fontWeight are unused here — fonts are fixed in MeldRenderer.
		MeldBandText: {
			x: 314,
			y: 288.5,
			fill: "black",
			fontFamily: "palatino_lt_italic",
			fontSize: 11.42,
			fontWeight: 400,
		},
		CardFooterTextLeft: {
			x: 44.5,
			y: 426,
			fill: "white",
			fontFamily:
				'dialog_cond_semiboldregular, "Arial Narrow", "Helvetica Condensed", Arial, sans-serif',
			fontSize: 11,
			fontWeight: 400,
			textAnchor: "start",
		},
		CardFooterTextRight: {
			x: 601,
			y: 426,
			fill: "white",
			fontFamily:
				'dialog_cond_semiboldregular, "Arial Narrow", "Helvetica Condensed", Arial, sans-serif',
			fontSize: 11,
			fontWeight: 400,
			textAnchor: "end",
		},
	},

	// elements is unused for meld (half + shared replace it) but required by BaseCardRenderConfig.
	elements: {},
};
