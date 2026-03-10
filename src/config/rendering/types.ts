/**
 * Card Rendering Type Definitions
 *
 * This module defines the configuration types for SVG-based card rendering.
 * Configurations specify exact positions, fonts, and dimensions for all
 * card elements across different card variants (flat vs dented backs).
 *
 * ## Coordinate System
 * - Origin (0,0) is top-left corner
 * - All positions are in pixels relative to the viewBox
 * - Default viewBox: 450x628px
 *
 * ## Configuration Structure
 * Each render config contains:
 * - **viewBox**: SVG canvas dimensions
 * - **masks**: Luminance masks for artwork clipping
 * - **clips**: ClipPaths for text overflow handling
 * - **elements**: Positioned configurations for each card element
 */

import type { ReactElement } from "react";
import type { CardStyle } from "../cards/card_styles.ts";

/**
 * Configuration for rendering SVG text elements.
 * Positions and styles card text like name, resource, power, defense, etc.
 */
export interface CardTextConfig {
	/** X position in pixels (relative to viewBox) */
	x: number;

	/** Y position in pixels (relative to viewBox) */
	y: number;

	/** Text color (e.g., "black", "#fff", "rgb(0,0,0)") */
	fill: string;

	/** Font family name (must be loaded via @font-face or system fonts) */
	fontFamily: string;

	/** Font size in pixels (may be dynamically scaled by hooks) */
	fontSize: number;

	/** Font weight (e.g., 400 for normal, 700 for bold) */
	fontWeight: number;

	/** Horizontal text alignment relative to x position */
	textAnchor?: "start" | "middle" | "end";

	/** Add a stroke around a text object */
	stroke?: string;

	/** Determine the width of said stroke */
	strokeWidth?: number;

	/** Determine in which order the stroke is painted */
	paintOrder?: string;

	/**
	 * Maximum rendered text width in SVG units before font scaling kicks in.
	 * When the text at baseFontSize exceeds this width, the font scales down
	 * proportionally so the text fits exactly within this box — mirroring
	 * real Flesh and Blood card name behaviour.
	 * If omitted, no width-based scaling is applied.
	 */
	maxWidth?: number;

	/**
	 * Y position used when the font is fully scaled down (at minFontSize).
	 * Interpolated against the base y to reproduce the slight baseline shift
	 * observed on real cards as longer names shrink.
	 * Defaults to the base y (no shift) when omitted.
	 */
	scaledY?: number;
}

/**
 * Configuration for rendering SVG image elements.
 * Used for symbols, icons, and card backs.
 */
export interface CardImageConfig {
	/** X position in pixels (top-left corner of image) */
	x: number;

	/** Y position in pixels (top-left corner of image) */
	y: number;

	/** Image width in pixels */
	width: number;

	/** Image height in pixels */
	height: number;
}

/**
 * Configuration for rendering SVG foreignObject elements.
 * ForeignObjects contain HTML content (like rich text from Tiptap editor).
 * Used primarily for card text with formatting.
 */
export interface CardObjectConfig {
	/** X position in pixels (top-left corner) */
	x: number;

	/** Y position in pixels (top-left corner) */
	y: number;

	/** Container width in pixels */
	width: number;

	/** Container height in pixels */
	height: number;
}

/**
 * Base configuration interface for card rendering.
 * Extended by specialized configurations for different card types.
 *
 * ⚠️ WARNING: Changing viewBox dimensions will break ALL element positioning!
 * All element positions are calculated relative to the viewBox coordinate system.
 */
export interface BaseCardRenderConfig {
	/** Indicates which renderer component to use */
	renderer: "normal" | "meld";

	/**
	 * SVG viewBox dimensions defining the coordinate system.
	 * Standard card viewBox: 450x628px
	 *
	 * All element positions (x, y, width, height) are relative to this viewBox.
	 * The actual rendered size is controlled by CSS, maintaining aspect ratio.
	 */
	viewBox: {
		/** ViewBox width in pixels */
		width: number;

		/** ViewBox height in pixels */
		height: number;
	};

	/**
	 * SVG mask definitions for clipping artwork to card shape.
	 * Masks use luminance (white areas visible, black areas hidden).
	 * Applied via mask="url(#mask-id)" attribute.
	 */
	masks: Record<string, ReactElement>;

	/**
	 * SVG clipPath definitions for constraining text overflow.
	 * Used to ensure text doesn't exceed designated areas.
	 * Applied via clipPath="url(#clip-id)" attribute.
	 */
	clips: Record<string, ReactElement>;

	/**
	 * Positioned configurations for all card elements.
	 * Keys match element names (CardName, CardText, CardPower, etc.)
	 * Values can be single configs or arrays for multi-line layouts.
	 */
	elements: Record<
		string,
		CardTextConfig | CardTextConfig[] | CardImageConfig | CardObjectConfig
	>;
}

/**
 * Shared interface for normal (non-meld) cards.
 * Supports two visual variants: flat and dented backs.
 */
interface NormalCardRenderConfig extends BaseCardRenderConfig {
	renderer: "normal";

	/** Card back visual style - affects footer layout and element positioning */
	variant: CardStyle;
}

/**
 * Render configuration for flat card backs.
 *
 * ## Flat Variant Characteristics:
 * - Footer text splits to left and right corners
 * - Slightly different element positioning vs dented variant
 * - Used for most modern card designs
 */
export interface NormalFlatRenderConfig extends NormalCardRenderConfig {
	variant: "flat";

	masks: {
		/** Mask defining the visible artwork area */
		CardArtWork: ReactElement;
	};

	clips: {
		/** ClipPath constraining the card title area */
		Title: ReactElement;

		/** ClipPath constraining the bottom text area (subtype/class) */
		BottomText: ReactElement;
	};

	elements: {
		/** Card name/title text (top center) */
		CardName: CardTextConfig;

		/** Resource cost text (top right) */
		CardResource: CardTextConfig;

		/** Main card text body (foreignObject for HTML rich text) */
		CardText: CardObjectConfig;

		/** Power symbol icon (bottom left) */
		CardPowerImage: CardImageConfig;

		/** Power value text */
		CardPowerText: CardTextConfig;

		/** Intellect value text */
		CardIntellectText: CardTextConfig;

		/** Defense symbol icon (bottom right) */
		CardDefenseImage: CardImageConfig;

		/** Defense value text */
		CardDefenseText: CardTextConfig;

		/** Life value text */
		CardLifeText: CardTextConfig;

		/** Bottom center text (class/subtype) */
		CardBottomText: CardTextConfig;

		/** Rarity icon (bottom left near power) */
		CardRarity: CardImageConfig;

		/** Footer text left side (set number) */
		CardFooterTextLeft: CardTextConfig;

		/** Footer text right side (artist credit) */
		CardFooterTextRight: CardTextConfig;
	};
}

/**
 * Render configuration for dented card backs.
 *
 * ## Dented Variant Characteristics:
 * - Footer text can be single-line (centered) or two-line (stacked)
 * - Slightly different power/defense positioning vs flat variant
 * - Used for some older card designs and special editions
 */
export interface NormalDentedRenderConfig extends NormalCardRenderConfig {
	variant: "dented";

	masks: {
		/** Mask defining the visible artwork area */
		CardArtWork: ReactElement;
	};

	clips: {
		/** ClipPath constraining the card title area */
		Title: ReactElement;

		/** ClipPath constraining the bottom text area (subtype/class) */
		BottomText: ReactElement;
	};

	elements: {
		/** Card name/title text (top center) */
		CardName: CardTextConfig;

		/** Resource cost text (top right) */
		CardResource: CardTextConfig;

		/** Main card text body (foreignObject for HTML rich text) */
		CardText: CardObjectConfig;

		/** Power symbol icon (bottom left) */
		CardPowerImage: CardImageConfig;

		/** Power value text */
		CardPowerText: CardTextConfig;

		/** Intellect value text */
		CardIntellectText: CardTextConfig;

		/** Defense symbol icon (bottom right) */
		CardDefenseImage: CardImageConfig;

		/** Defense value text */
		CardDefenseText: CardTextConfig;

		/** Life value text */
		CardLifeText: CardTextConfig;

		/** Bottom center text (class/subtype) */
		CardBottomText: CardTextConfig;

		/** Rarity icon (bottom center) */
		CardRarity: CardImageConfig;

		/** Single-line footer text (centered, used when only one footer element) */
		CardFooterTextSingle: CardTextConfig;

		/** Two-line footer text (both centered, stacked vertically) */
		CardFooterTextMulti: [CardTextConfig, CardTextConfig];
	};
}

/**
 * Render configuration for meld cards (not yet implemented).
 * Meld cards have special dual-sided layouts and different rendering requirements.
 */
export interface MeldCardRenderConfig extends BaseCardRenderConfig {
	renderer: "meld";
}

/**
 * Union type of all possible card render configurations.
 * Used for type-safe renderer selection and element access.
 */
export type CardRenderConfig =
	| NormalFlatRenderConfig
	| NormalDentedRenderConfig
	| MeldCardRenderConfig;
