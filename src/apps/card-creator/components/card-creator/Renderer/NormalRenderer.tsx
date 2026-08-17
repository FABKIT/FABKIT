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

import { useCardBottomText } from "@fabkit/apps/card-creator/components/card-creator/hooks/useCardBottomText.ts";
import { useCardFooterText } from "@fabkit/apps/card-creator/components/card-creator/hooks/useCardFooterText.ts";
import type {
	NormalDentedRenderConfig,
	NormalFlatRenderConfig,
} from "@fabkit/apps/card-creator/config/rendering/types.ts";
import {
	HYBRID_BLEND_MAX_WIDTH,
	useCardCreator,
} from "@fabkit/apps/card-creator/stores/card-creator.ts";
import { CardRarities } from "@fabkit/shared/config/cards/rarities.ts";
import { type ReactNode, type Ref, useMemo } from "react";
import { useDebounce } from "use-debounce";
import useObjectURL from "use-object-url";
import {
	useCardNameFontSize,
	useCardTextFontSize,
} from "../hooks/useScaledFontSize.ts";
import "../../../../../styles/components/normal-renderer.css";

export type NormalRendererProps = {
	/** Render configuration preset (flat or dented variant) */
	config: NormalFlatRenderConfig | NormalDentedRenderConfig;

	/** React ref for accessing the rendered SVG element (used for export) */
	ref?: Ref<SVGSVGElement>;
};

/**
 * Resolves the card back image URL for a given pitch, falling back to the
 * frame's first image. Image coverage varies per frame (hero frames have one
 * image, general frames have three), so each half of a hybrid must resolve
 * its own.
 *
 * Custom (user-uploaded) frames carry a registry-owned `blob:` URL on their
 * single image entry instead of a static fileName (see
 * stores/custom-frames.ts) — `objectUrl` takes precedence when present. This
 * single returned string is used BOTH as the `href` and, via its truthiness
 * on the right half, as the hybrid gate (see the caller below) — they must
 * never diverge, or a custom right-half would silently degrade hybrid to a
 * plain single frame.
 */
function resolveCardBackImage(
	cardBack:
		| {
				images: { pitch: number; fileName: string; objectUrl?: string }[];
		  }
		| null
		| undefined,
	pitch: number | null,
): string | undefined {
	const image =
		cardBack?.images.find((img) => img.pitch === pitch) ?? cardBack?.images[0];
	if (!image) return undefined;
	if (image.objectUrl) return image.objectUrl;
	// A custom frame whose registry-owned Blob failed to resolve (e.g. an
	// interrupted transaction left a customFrames row with no matching
	// frameImages row) has neither an objectUrl nor a real fileName — must
	// resolve to undefined, not the truthy-but-broken `/cardbacks/` that
	// `/cardbacks/${""}` would silently produce. A truthy-but-broken href on
	// the right half would keep the hybrid gate active with a 404 image
	// instead of gracefully degrading to a single left-only frame.
	return image.fileName ? `/cardbacks/${image.fileName}` : undefined;
}

/**
 * Normal Card Renderer
 *
 * Main rendering component for standard TCG cards.
 * Converts card creator state + render config into a complete SVG card.
 */
export function NormalRenderer({ config, ref }: NormalRendererProps) {
	const CardBack = useCardCreator((state) => state.CardBack);
	const CardBackRight = useCardCreator((state) => state.CardBackRight);
	const CardBackSplit = useCardCreator((state) => state.CardBackSplit);
	const CardBackBlend = useCardCreator((state) => state.CardBackBlend);
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
	const [debouncedCardTextHTML] = useDebounce(CardTextHTML, 150);
	// Inside SVG foreignObject, browsers (especially on macOS) do not trigger lazy
	// loading for img elements because the element is never considered "in viewport".
	// Strip loading="lazy" so symbols load eagerly and appear correctly on export.
	const eagerCardTextHTML = useMemo(
		() => debouncedCardTextHTML?.replace(/\bloading="lazy"\b/g, "") ?? null,
		[debouncedCardTextHTML],
	);
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
		html: eagerCardTextHTML || "",
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
	const cardBackHref = useMemo(
		() => resolveCardBackImage(CardBack, CardPitch),
		[CardBack, CardPitch],
	);
	// Right half of a hybrid frame resolves its own pitch image independently —
	// image coverage differs per frame, so it cannot reuse the left half's result.
	const cardBackRightHref = useMemo(
		() => resolveCardBackImage(CardBackRight, CardPitch),
		[CardBackRight, CardPitch],
	);

	// Blend band bounds in SVG units. A truly zero-width gradient is degenerate,
	// so a hard seam is expressed as a 1-unit band straddling the split instead.
	const splitX = config.viewBox.width * CardBackSplit;
	const blendWidth = CardBackBlend * HYBRID_BLEND_MAX_WIDTH;
	const blendStartX = splitX - Math.max(blendWidth, 1) / 2;
	const blendEndX = splitX + Math.max(blendWidth, 1) / 2;

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
				{config.artworkClip && (
					<clipPath id="artwork-clip">
						<rect
							x={config.artworkClip.x}
							y={config.artworkClip.y}
							width={config.artworkClip.width}
							height={config.artworkClip.height}
						/>
					</clipPath>
				)}
				<clipPath id="title-clip">{config.clips.Title}</clipPath>
				<clipPath id="bottom-text-clip">{config.clips.BottomText}</clipPath>
				{cardBackRightHref && (
					<>
						{/*
						 * The left frame is cut off at the END of the blend band, not at the
						 * seam. Card frames have transparent regions (the art window), so a
						 * full-width left frame would show through the right frame's
						 * transparent areas. Cutting at the band's end instead of its middle
						 * keeps the left frame fully present for the whole cross-fade, so
						 * there is no washed-out gap where neither frame covers.
						 */}
						<clipPath id="cardback-clip-left">
							<rect
								x={0}
								y={0}
								width={Math.max(blendEndX, 0)}
								height={config.viewBox.height}
							/>
						</clipPath>
						{/*
						 * The right frame is revealed by this gradient: black hides it, white
						 * shows it. A zero-width band gives a hard butt joint, a wide one
						 * feathers the two frames together. Verified to survive snapdom
						 * rasterisation, so preview and export match.
						 */}
						<mask id="cardback-mask-right">
							<linearGradient
								id="cardback-blend-gradient"
								gradientUnits="userSpaceOnUse"
								x1={blendStartX}
								y1={0}
								x2={blendEndX}
								y2={0}
							>
								<stop offset="0" stopColor="black" />
								<stop offset="1" stopColor="white" />
							</linearGradient>
							<rect
								x={0}
								y={0}
								width={config.viewBox.width}
								height={config.viewBox.height}
								fill="url(#cardback-blend-gradient)"
							/>
						</mask>
					</>
				)}
			</defs>

			{artwork && (
				<image
					href={artwork}
					x={CardArtPosition?.x || 0}
					y={CardArtPosition?.y || 0}
					width={CardArtPosition?.width || 0}
					height={CardArtPosition?.height || 0}
					preserveAspectRatio="xMidYMid slice"
					clipPath={config.artworkClip ? "url(#artwork-clip)" : undefined}
				/>
			)}

			{/*
			 * Card back layer. The hybrid halves are wrapped in their own <g> so the
			 * blend mask is scoped to this group: when the export rasteriser
			 * serialises the SVG it was applying the mask to following siblings too,
			 * which wiped the left half of the card title out of the PNG while the
			 * live preview looked correct. The group boundary contains it.
			 */}
			<g>
				<image
					href={cardBackHref}
					x="0"
					y="0"
					width={config.viewBox.width}
					height={config.viewBox.height}
					preserveAspectRatio="xMidYMid slice"
					clipPath={cardBackRightHref ? "url(#cardback-clip-left)" : undefined}
				/>

				{cardBackRightHref && (
					<image
						href={cardBackRightHref}
						x="0"
						y="0"
						width={config.viewBox.width}
						height={config.viewBox.height}
						preserveAspectRatio="xMidYMid slice"
						mask="url(#cardback-mask-right)"
					/>
				)}
			</g>

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

			{eagerCardTextHTML && (
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
							dangerouslySetInnerHTML={{ __html: eagerCardTextHTML }}
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
				<>
					<image
						href="/img/symbols/cardsymbol_intellect.svg"
						x={config.elements.CardPowerImage.x}
						y={config.elements.CardPowerImage.y}
						width={config.elements.CardPowerImage.width}
						height={config.elements.CardPowerImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>
					<text
						x={config.elements.CardIntellectText.x}
						y={config.elements.CardIntellectText.y}
						textAnchor={
							config.elements.CardIntellectText.textAnchor || "middle"
						}
						dominantBaseline="middle"
						fill={config.elements.CardIntellectText.fill}
						fontFamily={config.elements.CardIntellectText.fontFamily}
						fontSize={config.elements.CardIntellectText.fontSize}
						fontWeight={config.elements.CardIntellectText.fontWeight}
					>
						{CardIntellect}
					</text>
				</>
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
