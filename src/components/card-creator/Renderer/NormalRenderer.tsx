/**
 * Normal Card Renderer Component
 *
 * Renders standard (non-meld) TCG cards as SVG based on configuration presets.
 *
 * ## Rendering Process
 *
 * 1. **Card Back Layer**: Renders the base card back image (pitch-specific)
 * 2. **Artwork Layer**: Applies user artwork with mask clipping
 * 3. **Text Elements**: Renders card name, resource, power, defense, etc.
 * 4. **Rich Text**: Renders formatted card text via foreignObject + HTML
 * 5. **Footer**: Renders set number and artist credits (variant-specific layout)
 *
 * ## Dynamic Scaling
 *
 * Font sizes automatically scale based on content length:
 * - **Card Name**: Scales down for long names (uses useScaledFontSize)
 * - **Card Text**: Scales down for lengthy text (uses useScaledFontSizeFromHTML)
 * - **Bottom Text**: Scales for class/subtype overflow
 *
 * ## Masking & Clipping
 *
 * - **Artwork Mask**: Defines the visible card art area
 * - **Title Clip**: Prevents card name from overflowing title box
 * - **Bottom Text Clip**: Prevents class/subtype overflow
 *
 * ## Variant Differences
 *
 * - **Flat**: Footer splits into left/right corners
 * - **Dented**: Footer uses single or stacked centered text
 */

import { type ReactNode, type Ref, useMemo } from "react";
import useObjectURL from "use-object-url";
import { CardRarities } from "../../../config/cards/rarities.ts";
import type {
	NormalDentedRenderConfig,
	NormalFlatRenderConfig,
} from "../../../config/rendering/types.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";
import { useCardBottomText } from "../hooks/useCardBottomText.ts";
import { useCardFooterText } from "../hooks/useCardFooterText.ts";
import {
	useCardNameFontSize,
	useCardTextFontSize,
} from "../hooks/useScaledFontSize.ts";
import "../../../styles/components/normal-renderer.css";

export type NormalRendererProps = {
	/** Render configuration preset (flat or dented variant) */
	config: NormalFlatRenderConfig | NormalDentedRenderConfig;

	/** React ref for accessing the rendered SVG element (used for export) */
	ref?: Ref<SVGSVGElement>;
};

/**
 * Normal Card Renderer
 *
 * Main rendering component for standard TCG cards.
 * Converts card creator state + render config into a complete SVG card.
 */
export function NormalRenderer({ config, ref }: NormalRendererProps) {
	const CardBack = useCardCreator((state) => state.CardBack);
	const CardPitch = useCardCreator((state) => state.CardPitch);
	const CardName = useCardCreator((state) => state.CardName);
	const CardResource = useCardCreator((state) => state.CardResource);
	const CardPower = useCardCreator((state) => state.CardPower);
	const CardIntellect = useCardCreator((state) => state.CardHeroIntellect);
	const CardRarity = useCardCreator((state) => state.CardRarity);
	const CardDefense = useCardCreator((state) => state.CardDefense);
	const CardLife = useCardCreator((state) => state.CardLife);
	const CardArtwork = useCardCreator((state) => state.CardArtwork);
	const CardTextHTML = useCardCreator((state) => state.CardTextHTML);
	const CardArtPosition = useCardCreator((state) => state.CardArtPosition);
	const CardOverlay = useCardCreator((state) => state.CardOverlay);
	const CardOverlayOpacity = useCardCreator(
		(state) => state.CardOverlayOpacity,
	);

	// Scale the card name font size to fit its fixed-width box, mirroring real F&B cards.
	// Scaling only activates when the rendered text exceeds config.elements.CardName.maxWidth.
	const { fontSize: CardNameFontSize, y: CardNameY } = useCardNameFontSize({
		text: CardName || "",
		fontFamily: config.elements.CardName.fontFamily,
		fontWeight: config.elements.CardName.fontWeight,
		baseFontSize: config.elements.CardName.fontSize,
		baseY: config.elements.CardName.y,
		maxWidth: config.elements.CardName.maxWidth ?? Number.POSITIVE_INFINITY,
		scaledY: config.elements.CardName.scaledY,
	});

	// Scale the card description font size to fit its fixed-size box.
	// Uses binary search with hidden DOM measurement for accurate rich text handling.
	const CardTextFontSize = useCardTextFontSize({
		html: CardTextHTML || "",
		boxWidth: config.elements.CardText.width,
		boxHeight: config.elements.CardText.height,
		maxFontSize: config.elements.CardText.fontSize ?? 20,
		minFontSize: config.elements.CardText.minFontSize,
		lineHeight: config.elements.CardText.lineHeight,
		paragraphSpacing: config.elements.CardText.paragraphSpacing,
		overflowScalingFactor: config.elements.CardText.overflowScalingFactor,
	});

	const artwork = useObjectURL(CardArtwork);
	const overlay = useObjectURL(CardOverlay);
	const cardBackImage = useMemo(
		() =>
			CardBack?.images.find((image) => image.pitch === CardPitch) ||
			CardBack?.images[0],
		[CardBack?.images, CardPitch],
	);

	const cardBottomText = useCardBottomText();
	const footer = useCardFooterText();
	// Scale the bottom text font size to fit its fixed-width box, same approach as card name.
	const { fontSize: cardBottomTextFontSize, y: cardBottomTextY } =
		useCardNameFontSize({
			text: cardBottomText,
			fontFamily: config.elements.CardBottomText.fontFamily,
			fontWeight: config.elements.CardBottomText.fontWeight,
			baseFontSize: config.elements.CardBottomText.fontSize,
			baseY: config.elements.CardBottomText.y,
			maxWidth: config.elements.CardBottomText.maxWidth ?? config.viewBox.width,
			scaledY: config.elements.CardBottomText.scaledY,
		});

	const svgStyle = useMemo(
		() => ({
			aspectRatio: `${config.viewBox.width}/${config.viewBox.height}`,
		}),
		[config.viewBox.width, config.viewBox.height],
	);

	return (
		<svg
			ref={ref}
			viewBox={`0 0 ${config.viewBox.width} ${config.viewBox.height}`}
			width={config.viewBox.width}
			height={config.viewBox.height}
			style={svgStyle}
			className="w-full h-auto"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>{CardName}</title>
			<defs>
				<mask id="artwork-mask" mask-type="luminance">
					{config.masks.CardArtWork}
				</mask>
				<clipPath id="title-clip">{config.clips.Title}</clipPath>
				<clipPath id="bottom-text-clip">{config.clips.BottomText}</clipPath>
			</defs>

			{artwork && (
				<image
					href={artwork}
					x={CardArtPosition?.x || 0}
					y={CardArtPosition?.y || 0}
					width={CardArtPosition?.width || 0}
					height={CardArtPosition?.height || 0}
					preserveAspectRatio="xMidYMid slice"
					mask="url(#artwork-mask)"
				/>
			)}

			<image
				href={`/cardbacks/${cardBackImage?.fileName}`}
				x="0"
				y="0"
				width={config.viewBox.width}
				height={config.viewBox.height}
				preserveAspectRatio="xMidYMid slice"
			/>

			{/* Title bounds: x="86" y="40" width="278" height="30" */}
			{CardName && (
				<text
					x={config.elements.CardName.x}
					y={CardNameY}
					textAnchor={config.elements.CardName.textAnchor || "middle"}
					dominantBaseline="middle"
					fill={config.elements.CardName.fill}
					fontFamily={config.elements.CardName.fontFamily}
					fontSize={CardNameFontSize}
					fontWeight={config.elements.CardName.fontWeight}
					clipPath="url(#title-clip)"
				>
					{CardName}
				</text>
			)}

			{CardResource && (
				<text
					x={config.elements.CardResource.x}
					y={config.elements.CardResource.y}
					textAnchor={config.elements.CardResource.textAnchor || "middle"}
					dominantBaseline="middle"
					fill="none"
					fontFamily={config.elements.CardResource.fontFamily}
					fontSize={config.elements.CardResource.fontSize}
					fontWeight={config.elements.CardResource.fontWeight}
					stroke={config.elements.CardResource.stroke}
					strokeWidth={config.elements.CardResource.strokeWidth}
					paintOrder={config.elements.CardResource.paintOrder}
				>
					{CardResource}
				</text>
			)}
			{CardResource && (
				<text
					x={config.elements.CardResource.x}
					y={config.elements.CardResource.y}
					textAnchor={config.elements.CardResource.textAnchor || "middle"}
					dominantBaseline="middle"
					fill={config.elements.CardResource.fill}
					fontFamily={config.elements.CardResource.fontFamily}
					fontSize={config.elements.CardResource.fontSize}
					fontWeight={config.elements.CardResource.fontWeight}
				>
					{CardResource}
				</text>
			)}

			{CardTextHTML && (
				<foreignObject
					x={config.elements.CardText.x}
					y={config.elements.CardText.y}
					width={config.elements.CardText.width}
					height={config.elements.CardText.height}
				>
					<div className="flex h-full w-full flex-col justify-center items-center">
						<div
							className="renderedContent text-black text-center font-card-text"
							style={
								{
									fontSize: CardTextFontSize,
									lineHeight: config.elements.CardText.lineHeight,
									"--paragraph-spacing":
										config.elements.CardText.paragraphSpacing != null
											? `${config.elements.CardText.paragraphSpacing}em`
											: undefined,
									"--bold-font-size":
										config.elements.CardText.boldFontSize != null
											? `${config.elements.CardText.boldFontSize}em`
											: undefined,
									"--italic-font-size":
										config.elements.CardText.italicFontSize != null
											? `${config.elements.CardText.italicFontSize}em`
											: undefined,
									letterSpacing:
										config.elements.CardText.letterSpacing != null
											? `${config.elements.CardText.letterSpacing}em`
											: undefined,
									"--bold-letter-spacing":
										config.elements.CardText.boldLetterSpacing != null
											? `${config.elements.CardText.boldLetterSpacing}em`
											: undefined,
									"--italic-letter-spacing":
										config.elements.CardText.italicLetterSpacing != null
											? `${config.elements.CardText.italicLetterSpacing}em`
											: undefined,
								} as React.CSSProperties
							}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: editor content is HTML
							dangerouslySetInnerHTML={{ __html: CardTextHTML }}
						/>
					</div>
				</foreignObject>
			)}

			{CardPower && (
				<>
					<image
						href="/img/symbols/cardsymbol_power.svg"
						x={config.elements.CardPowerImage.x}
						y={config.elements.CardPowerImage.y}
						width={config.elements.CardPowerImage.width}
						height={config.elements.CardPowerImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>

					<text
						x={config.elements.CardPowerText.x}
						y={config.elements.CardPowerText.y}
						textAnchor={config.elements.CardPowerText.textAnchor || "middle"}
						dominantBaseline="middle"
						fill={config.elements.CardPowerText.fill}
						fontFamily={config.elements.CardPowerText.fontFamily}
						fontSize={config.elements.CardPowerText.fontSize}
						fontWeight={config.elements.CardPowerText.fontWeight}
					>
						{CardPower}
					</text>
				</>
			)}

			{CardIntellect && (
				<text
					x={config.elements.CardIntellectText.x}
					y={config.elements.CardIntellectText.y}
					textAnchor={config.elements.CardIntellectText.textAnchor || "middle"}
					dominantBaseline="middle"
					fill={config.elements.CardIntellectText.fill}
					fontFamily={config.elements.CardIntellectText.fontFamily}
					fontSize={config.elements.CardIntellectText.fontSize}
					fontWeight={config.elements.CardIntellectText.fontWeight}
				>
					{CardIntellect}
				</text>
			)}

			{CardDefense && (
				<>
					<image
						href="/img/symbols/cardsymbol_defense.svg"
						x={config.elements.CardDefenseImage.x}
						y={config.elements.CardDefenseImage.y}
						width={config.elements.CardDefenseImage.width}
						height={config.elements.CardDefenseImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>
					<text
						x={config.elements.CardDefenseText.x}
						y={config.elements.CardDefenseText.y}
						textAnchor={config.elements.CardDefenseText.textAnchor || "middle"}
						dominantBaseline="middle"
						fill={config.elements.CardDefenseText.fill}
						fontFamily={config.elements.CardDefenseText.fontFamily}
						fontSize={config.elements.CardDefenseText.fontSize}
						fontWeight={config.elements.CardDefenseText.fontWeight}
					>
						{CardDefense}
					</text>
				</>
			)}

			{CardLife && (
				<>
					<image
						href="/img/symbols/cardsymbol_life.svg"
						x={config.elements.CardDefenseImage.x}
						y={config.elements.CardDefenseImage.y}
						width={config.elements.CardDefenseImage.width}
						height={config.elements.CardDefenseImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>
					<text
						x={config.elements.CardLifeText.x}
						y={config.elements.CardLifeText.y}
						textAnchor={config.elements.CardLifeText.textAnchor || "middle"}
						dominantBaseline="middle"
						fill={config.elements.CardLifeText.fill}
						fontFamily={config.elements.CardLifeText.fontFamily}
						fontSize={config.elements.CardLifeText.fontSize}
						fontWeight={config.elements.CardLifeText.fontWeight}
					>
						{CardLife}
					</text>
				</>
			)}

			{cardBottomText && (
				<text
					x={config.elements.CardBottomText.x}
					y={cardBottomTextY}
					textAnchor={config.elements.CardBottomText.textAnchor || "middle"}
					dominantBaseline="middle"
					fill={config.elements.CardBottomText.fill}
					fontFamily={config.elements.CardBottomText.fontFamily}
					fontSize={cardBottomTextFontSize}
					fontWeight={config.elements.CardBottomText.fontWeight}
					clipPath="url(#bottom-text-clip)"
				>
					{cardBottomText}
				</text>
			)}

			<image
				href={CardRarities[CardRarity || "basic"].icon}
				x={config.elements.CardRarity.x}
				y={config.elements.CardRarity.y}
				width={config.elements.CardRarity.width}
				height={config.elements.CardRarity.height}
				preserveAspectRatio="xMidYMid slice"
			/>

			{config.variant === "dented" && generateDentedFooter(config, footer)}
			{config.variant === "flat" && generateFlatFooter(config, footer)}

			{overlay && (
				<image
					href={overlay}
					x={0}
					y={0}
					opacity={CardOverlayOpacity}
					width={config.viewBox.width}
					height={config.viewBox.height}
					preserveAspectRatio="xMidYMid slice"
				/>
			)}
		</svg>
	);
}

/**
 * Generates footer text for dented card backs.
 *
 * Layout logic:
 * - Single string: Renders centered single-line footer
 * - Array of 2 strings: Renders two centered lines (stacked vertically)
 *
 * @param config - Dented render configuration
 * @param footer - Footer text (single string or [line1, line2])
 * @returns React elements for footer text
 */
function generateDentedFooter(
	config: NormalDentedRenderConfig,
	footer: string | string[],
): ReactNode {
	if (Array.isArray(footer)) {
		return (
			<>
				<text
					x={config.elements.CardFooterTextMulti[0].x}
					y={config.elements.CardFooterTextMulti[0].y}
					textAnchor={
						config.elements.CardFooterTextMulti[0].textAnchor || "middle"
					}
					dominantBaseline="middle"
					fill={config.elements.CardFooterTextMulti[0].fill}
					fontFamily={config.elements.CardFooterTextMulti[0].fontFamily}
					fontSize={config.elements.CardFooterTextMulti[0].fontSize}
					fontWeight={config.elements.CardFooterTextMulti[0].fontWeight}
				>
					{footer[0]}
				</text>

				<text
					x={config.elements.CardFooterTextMulti[1].x}
					y={config.elements.CardFooterTextMulti[1].y}
					textAnchor={
						config.elements.CardFooterTextMulti[1].textAnchor || "middle"
					}
					dominantBaseline="middle"
					fill={config.elements.CardFooterTextMulti[1].fill}
					fontFamily={config.elements.CardFooterTextMulti[1].fontFamily}
					fontSize={config.elements.CardFooterTextMulti[1].fontSize}
					fontWeight={config.elements.CardFooterTextMulti[1].fontWeight}
				>
					{footer[1]}
				</text>
			</>
		);
	}

	return (
		<text
			x={config.elements.CardFooterTextSingle.x}
			y={config.elements.CardFooterTextSingle.y}
			textAnchor={config.elements.CardFooterTextSingle.textAnchor || "middle"}
			dominantBaseline="middle"
			fill={config.elements.CardFooterTextSingle.fill}
			fontFamily={config.elements.CardFooterTextSingle.fontFamily}
			fontSize={config.elements.CardFooterTextSingle.fontSize}
			fontWeight={config.elements.CardFooterTextSingle.fontWeight}
		>
			{footer}
		</text>
	);
}

/**
 * Generates footer text for flat card backs.
 *
 * Layout logic:
 * - Single string: No footer (returns null)
 * - Array of 2 strings: Splits into left and right corners
 *
 * Typically used for:
 * - Left: Set number (e.g., "MON001")
 * - Right: Artist credit (e.g., "ARTIST NAME")
 *
 * @param config - Flat render configuration
 * @param footer - Footer text array [left, right]
 * @returns React elements for footer text or null
 */
function generateFlatFooter(
	config: NormalFlatRenderConfig,
	footer: string | string[],
): ReactNode {
	if (!Array.isArray(footer)) {
		return null;
	}

	return (
		<>
			<text
				x={config.elements.CardFooterTextLeft.x}
				y={config.elements.CardFooterTextLeft.y}
				textAnchor={config.elements.CardFooterTextLeft.textAnchor || "middle"}
				dominantBaseline="central"
				fill={config.elements.CardFooterTextLeft.fill}
				fontFamily={config.elements.CardFooterTextLeft.fontFamily}
				fontSize={config.elements.CardFooterTextLeft.fontSize}
				fontWeight={config.elements.CardFooterTextLeft.fontWeight}
			>
				{footer[0]}
			</text>

			<text
				x={config.elements.CardFooterTextRight.x}
				y={config.elements.CardFooterTextRight.y}
				textAnchor={config.elements.CardFooterTextRight.textAnchor || "middle"}
				dominantBaseline="middle"
				fill={config.elements.CardFooterTextRight.fill}
				fontFamily={config.elements.CardFooterTextRight.fontFamily}
				fontSize={config.elements.CardFooterTextRight.fontSize}
				fontWeight={config.elements.CardFooterTextRight.fontWeight}
			>
				{footer[1]}
			</text>
		</>
	);
}
