/**
 * Meld Card Renderer
 *
 * Landscape SVG (628×450) split into two upright half-cards:
 *
 *   ┌─────────────────────┬──┬─────────────────────┐
 *   │   LEFT HALF (A)     │  │   RIGHT HALF (B)    │
 *   └─────────────────────┴──┴─────────────────────┘
 *   x=0                 306 322                   628
 *
 * Both halves render in root SVG space; the right half uses bX(rx) = 322 + rx
 * to offset per-half element positions. Pitch/cost are shared and mirrored at
 * both top corners. The active half is highlighted with a dashed overlay.
 */

import { type Ref, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";
import useObjectURL from "use-object-url";
import { CardRarities } from "../../../config/cards/rarities.ts";
import {
	type CardClass,
	CardClasses,
	CardSubtypes,
	type CardTalent,
	CardTalents,
	CardTypes,
} from "../../../config/cards.ts";
import type { MeldCardRenderConfig } from "../../../config/rendering/types.ts";
import type { MeldHalf } from "../../../stores/card-creator.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";
import {
	useCardNameFontSize,
	useCardTextFontSize,
} from "../hooks/useScaledFontSize.ts";
import "../../../styles/components/normal-renderer.css";

export type MeldRendererProps = {
	config: MeldCardRenderConfig;
	ref?: Ref<SVGSVGElement>;
	/** When true, hides the active-half highlight overlay (used during export). */
	isExport?: boolean;
};

// ─── Helper: compute bottom text for one meld half ────────────────────────────

function computeHalfBottomText(
	half: MeldHalf,
	t: (key: string) => string,
): string {
	const {
		CardType,
		CardTalent,
		CardClass,
		CardSecondaryClass,
		CardSubType,
		CardWeapon,
	} = half;

	const talent =
		CardTalent && CardTalent !== "none"
			? t(CardTalents[CardTalent as CardTalent]) || CardTalent
			: null;

	const primaryClass =
		CardClass && CardClass !== "none"
			? t(CardClasses[CardClass as CardClass]) || CardClass
			: null;

	const secondaryClass =
		CardSecondaryClass && CardSecondaryClass !== "none"
			? t(CardClasses[CardSecondaryClass as CardClass]) || CardSecondaryClass
			: null;

	const classText =
		primaryClass && secondaryClass
			? `${primaryClass} / ${secondaryClass}`
			: primaryClass;

	const cardTypeText = CardType ? t(CardTypes[CardType].label) : null;

	const subtypeParts: string[] = [];
	if (CardType && CardSubType && CardSubType !== "none") {
		const subtypeKey = CardSubtypes[CardType]?.[CardSubType] || CardSubType;
		if (subtypeKey) subtypeParts.push(t(subtypeKey));
	}
	if (
		(CardType === "weapon" || CardType === "weapon_equipment") &&
		CardWeapon
	) {
		subtypeParts.push(CardWeapon);
	}
	const subtypeText =
		subtypeParts.length > 0 ? `- ${subtypeParts.join(" ")}` : null;

	return [talent, classText, cardTypeText, subtypeText]
		.filter((p): p is string => Boolean(p))
		.join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MeldRenderer({
	config,
	ref,
	isExport = false,
}: MeldRendererProps) {
	const { t } = useTranslation();

	// ── Store reads ────────────────────────────────────────────────────────────
	const halfA = useCardCreator((state) => state.meldHalfA);
	const halfB = useCardCreator((state) => state.meldHalfB);
	const meldActiveHalf = useCardCreator((state) => state.meldActiveHalf);
	const CardPitch = useCardCreator((state) => state.CardPitch);
	const CardResource = useCardCreator((state) => state.CardResource);
	const CardPower = useCardCreator((state) => state.CardPower);
	const CardDefense = useCardCreator((state) => state.CardDefense);
	const CardLife = useCardCreator((state) => state.CardLife);
	const CardIntellect = useCardCreator((state) => state.CardHeroIntellect);
	const CardRarity = useCardCreator((state) => state.CardRarity);
	const CardBack = useCardCreator((state) => state.CardBack);
	const CardSetNumber = useCardCreator((state) => state.CardSetNumber);
	const CardArtworkCredits = useCardCreator(
		(state) => state.CardArtworkCredits,
	);

	// ── Artwork object URLs ────────────────────────────────────────────────────
	const leftArtwork = useObjectURL(halfA.CardArtwork);
	const rightArtwork = useObjectURL(halfB.CardArtwork);
	const CardOverlay = useCardCreator((state) => state.CardOverlay);
	const CardOverlayOpacity = useCardCreator(
		(state) => state.CardOverlayOpacity,
	);
	const overlay = useObjectURL(CardOverlay);

	// ── Card back ──────────────────────────────────────────────────────────────
	// Meld card backs don't have pitch variants — always use images[0]
	const cardBackImageUrl = CardBack?.images[0]
		? `/cardbacks/${CardBack.images[0].fileName}`
		: null;

	// ── Debounced rich text HTML ───────────────────────────────────────────────
	const [debouncedHalfAHTML] = useDebounce(halfA.CardTextHTML, 150);
	const [debouncedHalfBHTML] = useDebounce(halfB.CardTextHTML, 150);

	const eagerHalfAHTML = useMemo(
		() => debouncedHalfAHTML?.replace(/\bloading="lazy"\b/g, "") ?? null,
		[debouncedHalfAHTML],
	);
	const eagerHalfBHTML = useMemo(
		() => debouncedHalfBHTML?.replace(/\bloading="lazy"\b/g, "") ?? null,
		[debouncedHalfBHTML],
	);

	// ── Font size scaling: card names ──────────────────────────────────────────
	const { fontSize: halfANameFS, y: halfANameY } = useCardNameFontSize({
		text: halfA.CardName || "",
		fontFamily: config.half.CardName.fontFamily,
		fontWeight: config.half.CardName.fontWeight,
		baseFontSize: config.half.CardName.fontSize,
		baseY: config.half.CardName.y,
		maxWidth: config.half.CardName.maxWidth ?? Number.POSITIVE_INFINITY,
		scaledY: config.half.CardName.scaledY,
		minFontSize: 5,
	});

	const { fontSize: halfBNameFS, y: halfBNameY } = useCardNameFontSize({
		text: halfB.CardName || "",
		fontFamily: config.half.CardName.fontFamily,
		fontWeight: config.half.CardName.fontWeight,
		baseFontSize: config.half.CardName.fontSize,
		baseY: config.half.CardName.y,
		maxWidth: config.half.CardName.maxWidth ?? Number.POSITIVE_INFINITY,
		scaledY: config.half.CardName.scaledY,
		minFontSize: 5,
	});

	// ── Font size scaling: card text bodies ────────────────────────────────────
	const halfATextFS = useCardTextFontSize({
		html: eagerHalfAHTML || "",
		boxWidth: config.half.CardText.width,
		boxHeight: config.half.CardText.height,
		maxFontSize: config.half.CardText.fontSize ?? 12,
		minFontSize: config.half.CardText.minFontSize,
		overflowScalingFactor: config.half.CardText.overflowScalingFactor,
	});

	const halfBTextFS = useCardTextFontSize({
		html: eagerHalfBHTML || "",
		boxWidth: config.half.CardText.width,
		boxHeight: config.half.CardText.height,
		maxFontSize: config.half.CardText.fontSize ?? 12,
		minFontSize: config.half.CardText.minFontSize,
		overflowScalingFactor: config.half.CardText.overflowScalingFactor,
	});

	// ── Font size scaling: bottom text (class / type line) ────────────────────
	const halfABottomText = useMemo(
		() => computeHalfBottomText(halfA, t),
		[halfA, t],
	);

	const halfBBottomText = useMemo(
		() => computeHalfBottomText(halfB, t),
		[halfB, t],
	);

	const { fontSize: halfABottomTextFS, y: halfABottomTextY } =
		useCardNameFontSize({
			text: halfABottomText,
			fontFamily: config.half.CardBottomText.fontFamily,
			fontWeight: config.half.CardBottomText.fontWeight,
			baseFontSize: config.half.CardBottomText.fontSize,
			baseY: config.half.CardBottomText.y,
			maxWidth: config.half.CardBottomText.maxWidth ?? config.viewBox.width,
			scaledY: config.half.CardBottomText.scaledY,
			minFontSize: 5,
		});

	const { fontSize: halfBBottomTextFS, y: halfBBottomTextY } =
		useCardNameFontSize({
			text: halfBBottomText,
			fontFamily: config.half.CardBottomText.fontFamily,
			fontWeight: config.half.CardBottomText.fontWeight,
			baseFontSize: config.half.CardBottomText.fontSize,
			baseY: config.half.CardBottomText.y,
			maxWidth: config.half.CardBottomText.maxWidth ?? config.viewBox.width,
			scaledY: config.half.CardBottomText.scaledY,
			minFontSize: 5,
		});

	// ── Footer text ───────────────────────────────────────────────────────────
	const footer: [string, string] = useMemo(
		() => [
			[CardSetNumber, "FABKIT", CardArtworkCredits]
				.filter((v) => v?.trim()?.length)
				.join(" | "),
			"FaB TCC BY LSS",
		],
		[CardSetNumber, CardArtworkCredits],
	);

	// ── Meld band text ────────────────────────────────────────────────────────
	// "Meld" renders in bold; the description in italic — split into two tspans.
	const meldBandKeyword = t("card_creator.meld_band_keyword");
	const meldBandDescription = t("card_creator.meld_band_description", {
		cost: CardResource ?? "0",
	});

	// ── Geometry helpers ──────────────────────────────────────────────────────
	// rightHalfStart is only used for the active-half highlight rect.
	const rightHalfStart = config.leftHalfWidth + config.centerGap;
	const W = config.viewBox.width;
	// Mirror a center-anchored point (textAnchor="middle") across the card centre.
	const mX = (x: number) => W - x;
	// Mirror a box's top-left x (foreignObject, clip rects) across the card centre.
	const mXBox = (x: number, w: number) => W - x - w;

	const svgStyle = useMemo(
		() => ({
			aspectRatio: `${config.viewBox.width}/${config.viewBox.height}`,
		}),
		[config.viewBox.width, config.viewBox.height],
	);

	const rarityIcon = CardRarities[CardRarity || "basic"].icon;

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
			<title>
				{[halfA.CardName, halfB.CardName].filter(Boolean).join(" // ") ||
					"Meld Card"}
			</title>

			<defs>
				{/* Artwork clip paths — keep each artwork inside its window */}
				<clipPath id="meld-left-artwork-clip">
					<rect
						x={config.leftArtworkDragZone.x}
						y={config.leftArtworkDragZone.y}
						width={config.leftArtworkDragZone.width}
						height={config.leftArtworkDragZone.height}
					/>
				</clipPath>
				{/* Right artwork clip — absolute coords from rightArtworkDragZone */}
				<clipPath id="meld-right-artwork-clip">
					<rect
						x={config.rightArtworkDragZone.x}
						y={config.rightArtworkDragZone.y}
						width={config.rightArtworkDragZone.width}
						height={config.rightArtworkDragZone.height}
					/>
				</clipPath>

				{/* Text clip paths — derived from half config width/height so tuning
				    one value updates both the clip and the DEV bounding box. */}
				<clipPath id="meld-left-title-clip">
					<rect
						x={config.half.CardName.x - (config.half.CardName.width ?? 0) / 2}
						y={config.half.CardName.y - (config.half.CardName.height ?? 0) / 2}
						width={config.half.CardName.width ?? 0}
						height={config.half.CardName.height ?? 0}
					/>
				</clipPath>
				<clipPath id="meld-right-title-clip">
					<rect
						x={
							mX(config.half.CardName.x) - (config.half.CardName.width ?? 0) / 2
						}
						y={config.half.CardName.y - (config.half.CardName.height ?? 0) / 2}
						width={config.half.CardName.width ?? 0}
						height={config.half.CardName.height ?? 0}
					/>
				</clipPath>
				<clipPath id="meld-left-bottom-text-clip">
					<rect
						x={
							config.half.CardBottomText.x -
							(config.half.CardBottomText.width ?? 0) / 2
						}
						y={
							config.half.CardBottomText.y -
							(config.half.CardBottomText.height ?? 0) / 2
						}
						width={config.half.CardBottomText.width ?? 0}
						height={config.half.CardBottomText.height ?? 0}
					/>
				</clipPath>
				<clipPath id="meld-right-bottom-text-clip">
					<rect
						x={
							mX(config.half.CardBottomText.x) -
							(config.half.CardBottomText.width ?? 0) / 2
						}
						y={
							config.half.CardBottomText.y -
							(config.half.CardBottomText.height ?? 0) / 2
						}
						width={config.half.CardBottomText.width ?? 0}
						height={config.half.CardBottomText.height ?? 0}
					/>
				</clipPath>
			</defs>

			{/* ── Artwork layers (behind card back) ─────────────────────────── */}
			{leftArtwork && halfA.CardArtPosition && (
				<image
					href={leftArtwork}
					x={halfA.CardArtPosition.x}
					y={halfA.CardArtPosition.y}
					width={halfA.CardArtPosition.width}
					height={halfA.CardArtPosition.height}
					preserveAspectRatio="xMidYMid slice"
					clipPath="url(#meld-left-artwork-clip)"
				/>
			)}

			{rightArtwork && halfB.CardArtPosition && (
				<image
					href={rightArtwork}
					x={halfB.CardArtPosition.x}
					y={halfB.CardArtPosition.y}
					width={halfB.CardArtPosition.width}
					height={halfB.CardArtPosition.height}
					preserveAspectRatio="xMidYMid slice"
					clipPath="url(#meld-right-artwork-clip)"
				/>
			)}

			{/* ── Card back (landscape, no rotation needed) ─────────────────── */}
			{cardBackImageUrl && (
				<image
					href={cardBackImageUrl}
					x="0"
					y="0"
					width={config.viewBox.width}
					height={config.viewBox.height}
					preserveAspectRatio="xMidYMid slice"
				/>
			)}

			{/* ── DEV: bounding box visualisation (uncomment to re-enable) ────
			 *   Orange = CardName, Blue = CardText, Green = CardBottomText
			 *   All rects derive from half config — tuning one value updates clip + box.
			 */}
			{/* {import.meta.env.DEV && (
				<>
					<rect x={config.half.CardName.x - (config.half.CardName.width ?? 0) / 2} y={config.half.CardName.y - (config.half.CardName.height ?? 0) / 2} width={config.half.CardName.width ?? 0} height={config.half.CardName.height ?? 0} fill="none" stroke="orange" strokeWidth={0.5} />
					<rect x={mX(config.half.CardName.x) - (config.half.CardName.width ?? 0) / 2} y={config.half.CardName.y - (config.half.CardName.height ?? 0) / 2} width={config.half.CardName.width ?? 0} height={config.half.CardName.height ?? 0} fill="none" stroke="orange" strokeWidth={0.5} />
					<rect x={config.half.CardText.x} y={config.half.CardText.y} width={config.half.CardText.width} height={config.half.CardText.height} fill="none" stroke="royalblue" strokeWidth={0.5} />
					<rect x={mXBox(config.half.CardText.x, config.half.CardText.width)} y={config.half.CardText.y} width={config.half.CardText.width} height={config.half.CardText.height} fill="none" stroke="royalblue" strokeWidth={0.5} />
					<rect x={config.half.CardBottomText.x - (config.half.CardBottomText.width ?? 0) / 2} y={config.half.CardBottomText.y - (config.half.CardBottomText.height ?? 0) / 2} width={config.half.CardBottomText.width ?? 0} height={config.half.CardBottomText.height ?? 0} fill="none" stroke="limegreen" strokeWidth={0.5} />
					<rect x={mX(config.half.CardBottomText.x) - (config.half.CardBottomText.width ?? 0) / 2} y={config.half.CardBottomText.y - (config.half.CardBottomText.height ?? 0) / 2} width={config.half.CardBottomText.width ?? 0} height={config.half.CardBottomText.height ?? 0} fill="none" stroke="limegreen" strokeWidth={0.5} />
				</>
			)} */}

			{/* ══ LEFT HALF (Half A) — normal orientation ══════════════════════ */}

			{halfA.CardName && (
				<text
					x={config.half.CardName.x}
					y={halfANameY}
					textAnchor="middle"
					dominantBaseline="middle"
					fill={config.half.CardName.fill}
					fontFamily={config.half.CardName.fontFamily}
					fontSize={halfANameFS}
					fontWeight={config.half.CardName.fontWeight}
					clipPath="url(#meld-left-title-clip)"
				>
					{halfA.CardName}
				</text>
			)}

			{eagerHalfAHTML && (
				<foreignObject
					x={config.half.CardText.x}
					y={config.half.CardText.y}
					width={config.half.CardText.width}
					height={config.half.CardText.height}
				>
					<div className="flex h-full w-full flex-col justify-center items-center">
						<div
							className="renderedContent text-black text-center font-card-text"
							style={{ fontSize: halfATextFS }}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: editor content
							dangerouslySetInnerHTML={{ __html: eagerHalfAHTML }}
						/>
					</div>
				</foreignObject>
			)}

			{halfABottomText && (
				<text
					x={config.half.CardBottomText.x}
					y={halfABottomTextY}
					textAnchor="middle"
					dominantBaseline="middle"
					fill={config.half.CardBottomText.fill}
					fontFamily={config.half.CardBottomText.fontFamily}
					fontSize={halfABottomTextFS}
					fontWeight={config.half.CardBottomText.fontWeight}
					clipPath="url(#meld-left-bottom-text-clip)"
				>
					{halfABottomText}
				</text>
			)}

			{/* ══ RIGHT HALF (Half B) — mirrored from card centre ══════════════ */}
			{halfB.CardName && (
				<text
					x={mX(config.half.CardName.x)}
					y={halfBNameY}
					textAnchor="middle"
					dominantBaseline="middle"
					fill={config.half.CardName.fill}
					fontFamily={config.half.CardName.fontFamily}
					fontSize={halfBNameFS}
					fontWeight={config.half.CardName.fontWeight}
					clipPath="url(#meld-right-title-clip)"
				>
					{halfB.CardName}
				</text>
			)}

			{eagerHalfBHTML && (
				<foreignObject
					x={mXBox(config.half.CardText.x, config.half.CardText.width)}
					y={config.half.CardText.y}
					width={config.half.CardText.width}
					height={config.half.CardText.height}
				>
					<div className="flex h-full w-full flex-col justify-center items-center">
						<div
							className="renderedContent text-black text-center font-card-text"
							style={{ fontSize: halfBTextFS }}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: editor content
							dangerouslySetInnerHTML={{ __html: eagerHalfBHTML }}
						/>
					</div>
				</foreignObject>
			)}

			{halfBBottomText && (
				<text
					x={mX(config.half.CardBottomText.x)}
					y={halfBBottomTextY}
					textAnchor="middle"
					dominantBaseline="middle"
					fill={config.half.CardBottomText.fill}
					fontFamily={config.half.CardBottomText.fontFamily}
					fontSize={halfBBottomTextFS}
					fontWeight={config.half.CardBottomText.fontWeight}
					clipPath="url(#meld-right-bottom-text-clip)"
				>
					{halfBBottomText}
				</text>
			)}

			{/* ══ SHARED ELEMENTS ════════════════════════════════════════════════ */}

			{/* Rarity icon — shared, absolute SVG coords */}
			<image
				href={rarityIcon}
				x={config.shared.CardRarity.x}
				y={config.shared.CardRarity.y}
				width={config.shared.CardRarity.width}
				height={config.shared.CardRarity.height}
				preserveAspectRatio="xMidYMid slice"
			/>

			{/* Meld band keyword text — "Meld" bold, description italic */}
			<text
				x={config.shared.MeldBandText.x}
				y={config.shared.MeldBandText.y}
				textAnchor="middle"
				dominantBaseline="middle"
				fill={config.shared.MeldBandText.fill}
				fontSize={config.shared.MeldBandText.fontSize}
			>
				<tspan fontFamily="palatino_lt_stdbold">{meldBandKeyword}</tspan>
				<tspan fontFamily="palatino_lt_italic">{meldBandDescription}</tspan>
			</text>

			{/* Pitch indicator */}
			{CardPitch && (
				<text
					x={config.shared.CardResource.x}
					y={config.shared.CardResource.y - 14}
					textAnchor="middle"
					dominantBaseline="middle"
					fill="white"
					fontFamily={config.shared.CardResource.fontFamily}
					fontSize={7}
					fontWeight={400}
					opacity={0.8}
				>
					{CardPitch === 1 ? "●" : CardPitch === 2 ? "●●" : "●●●"}
				</text>
			)}

			{/* Resource cost — single instance, position set in shared.CardResource */}
			{CardResource && (
				<>
					<text
						x={config.shared.CardResource.x}
						y={config.shared.CardResource.y}
						textAnchor="middle"
						dominantBaseline="middle"
						fill="none"
						fontFamily={config.shared.CardResource.fontFamily}
						fontSize={config.shared.CardResource.fontSize}
						fontWeight={config.shared.CardResource.fontWeight}
						stroke={config.shared.CardResource.stroke}
						strokeWidth={config.shared.CardResource.strokeWidth}
						paintOrder={config.shared.CardResource.paintOrder}
					>
						{CardResource}
					</text>
					<text
						x={config.shared.CardResource.x}
						y={config.shared.CardResource.y}
						textAnchor="middle"
						dominantBaseline="middle"
						fill={config.shared.CardResource.fill}
						fontFamily={config.shared.CardResource.fontFamily}
						fontSize={config.shared.CardResource.fontSize}
						fontWeight={config.shared.CardResource.fontWeight}
					>
						{CardResource}
					</text>
				</>
			)}

			{/* Power (bottom-left corner pearl) */}
			{CardPower && (
				<>
					<image
						href="/img/symbols/cardsymbol_power.svg"
						x={config.shared.CardPowerImage.x}
						y={config.shared.CardPowerImage.y}
						width={config.shared.CardPowerImage.width}
						height={config.shared.CardPowerImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>
					<text
						x={config.shared.CardPowerText.x}
						y={config.shared.CardPowerText.y}
						textAnchor="middle"
						dominantBaseline="middle"
						fill={config.shared.CardPowerText.fill}
						fontFamily={config.shared.CardPowerText.fontFamily}
						fontSize={config.shared.CardPowerText.fontSize}
						fontWeight={config.shared.CardPowerText.fontWeight}
					>
						{CardPower}
					</text>
				</>
			)}

			{/* Intellect — uses the power pearl position (same as life uses defense) */}
			{CardIntellect && (
				<>
					<image
						href="/img/symbols/cardsymbol_intellect.svg"
						x={config.shared.CardPowerImage.x}
						y={config.shared.CardPowerImage.y}
						width={config.shared.CardPowerImage.width}
						height={config.shared.CardPowerImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>
					<text
						x={config.shared.CardIntellectText.x}
						y={config.shared.CardIntellectText.y}
						textAnchor="middle"
						dominantBaseline="middle"
						fill={config.shared.CardIntellectText.fill}
						fontFamily={config.shared.CardIntellectText.fontFamily}
						fontSize={config.shared.CardIntellectText.fontSize}
						fontWeight={config.shared.CardIntellectText.fontWeight}
					>
						{CardIntellect}
					</text>
				</>
			)}

			{/* Defense (bottom-right corner pearl) */}
			{CardDefense && (
				<>
					<image
						href="/img/symbols/cardsymbol_defense.svg"
						x={config.shared.CardDefenseImage.x}
						y={config.shared.CardDefenseImage.y}
						width={config.shared.CardDefenseImage.width}
						height={config.shared.CardDefenseImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>
					<text
						x={config.shared.CardDefenseText.x}
						y={config.shared.CardDefenseText.y}
						textAnchor="middle"
						dominantBaseline="middle"
						fill={config.shared.CardDefenseText.fill}
						fontFamily={config.shared.CardDefenseText.fontFamily}
						fontSize={config.shared.CardDefenseText.fontSize}
						fontWeight={config.shared.CardDefenseText.fontWeight}
					>
						{CardDefense}
					</text>
				</>
			)}

			{/* Life (bottom-right corner, alternative to defense) */}
			{CardLife && (
				<>
					<image
						href="/img/symbols/cardsymbol_life.svg"
						x={config.shared.CardDefenseImage.x}
						y={config.shared.CardDefenseImage.y}
						width={config.shared.CardDefenseImage.width}
						height={config.shared.CardDefenseImage.height}
						preserveAspectRatio="xMidYMid slice"
					/>
					<text
						x={config.shared.CardLifeText.x}
						y={config.shared.CardLifeText.y}
						textAnchor="middle"
						dominantBaseline="middle"
						fill={config.shared.CardLifeText.fill}
						fontFamily={config.shared.CardLifeText.fontFamily}
						fontSize={config.shared.CardLifeText.fontSize}
						fontWeight={config.shared.CardLifeText.fontWeight}
					>
						{CardLife}
					</text>
				</>
			)}

			{/* Footer */}
			<text
				x={config.shared.CardFooterTextLeft.x}
				y={config.shared.CardFooterTextLeft.y}
				textAnchor={config.shared.CardFooterTextLeft.textAnchor || "start"}
				dominantBaseline="middle"
				fill={config.shared.CardFooterTextLeft.fill}
				fontFamily={config.shared.CardFooterTextLeft.fontFamily}
				fontSize={config.shared.CardFooterTextLeft.fontSize}
				fontWeight={config.shared.CardFooterTextLeft.fontWeight}
			>
				{footer[0]}
			</text>
			<text
				x={config.shared.CardFooterTextRight.x}
				y={config.shared.CardFooterTextRight.y}
				textAnchor={config.shared.CardFooterTextRight.textAnchor || "end"}
				dominantBaseline="middle"
				fill={config.shared.CardFooterTextRight.fill}
				fontFamily={config.shared.CardFooterTextRight.fontFamily}
				fontSize={config.shared.CardFooterTextRight.fontSize}
				fontWeight={config.shared.CardFooterTextRight.fontWeight}
			>
				{footer[1]}
			</text>

			{/* Dev overlay — reference image for preset tuning */}
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

			{/* Active-half highlight — dashed primary-tinted border around the
				half currently being edited. Hidden during export. */}
			{!isExport && (
				<rect
					data-export-hide="true"
					x={meldActiveHalf === "A" ? 2 : rightHalfStart}
					y={2}
					width={
						meldActiveHalf === "A"
							? config.leftHalfWidth - 2
							: config.viewBox.width - rightHalfStart - 2
					}
					height={config.viewBox.height - 4}
					fill="none"
					stroke="#C42025"
					strokeWidth={2}
					strokeDasharray="6 4"
					opacity={0.75}
					pointerEvents="none"
					rx={6}
				/>
			)}
		</svg>
	);
}
