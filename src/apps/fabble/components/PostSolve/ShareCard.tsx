import { forwardRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FabkitIconSrc from "@fabkit/assets/Fabkitlogo_notext.svg?url";
import { FabbleModes, type FabbleMode, type FeedbackRow, type GuessEntry } from "@fabkit/apps/fabble/lib/types";

// ─── Share card theme ─────────────────────────────────────────────────────────
// Colors are read from CSS custom properties at runtime so the share card
// stays in sync with the design system. The fallback values match the dark theme.

interface ShareCardColors {
	bg: string;
	surface: string;
	accent: string;
	heading: string;
	muted: string;
	subtle: string;
	separator: string;
	tileEmpty: string;
	tileEmptyBorder: string;
	match: string;
	partial: string;
	noMatch: string;
	na: string;
}

const FALLBACK_COLORS: ShareCardColors = {
	bg: "#2a2a2a",
	surface: "#222222",
	accent: "#a6864a",
	heading: "#ffffff",
	muted: "#999999",
	subtle: "#666666",
	separator: "#3d3626",
	tileEmpty: "#383838",
	tileEmptyBorder: "#4a4a4a",
	match: "#35ce8d",
	partial: "#e4ff1a",
	noMatch: "#d64045",
	na: "#7c809b",
};

/** Reads a CSS custom property from the element, returning fallback if unset. */
function readCssVar(el: Element, name: string, fallback: string): string {
	return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

function readThemeColors(el: Element): ShareCardColors {
	return {
		bg: readCssVar(el, "--color-surface", FALLBACK_COLORS.bg),
		surface: readCssVar(el, "--color-surface-muted", FALLBACK_COLORS.surface),
		accent: readCssVar(el, "--color-primary", FALLBACK_COLORS.accent),
		heading: readCssVar(el, "--color-heading", FALLBACK_COLORS.heading),
		muted: readCssVar(el, "--color-muted", FALLBACK_COLORS.muted),
		subtle: readCssVar(el, "--color-subtle", FALLBACK_COLORS.subtle),
		separator: readCssVar(el, "--color-border-primary", FALLBACK_COLORS.separator),
		tileEmpty: readCssVar(el, "--color-fabble-empty", FALLBACK_COLORS.tileEmpty),
		tileEmptyBorder: readCssVar(el, "--color-fabble-border", FALLBACK_COLORS.tileEmptyBorder),
		match: readCssVar(el, "--color-fabble-match", FALLBACK_COLORS.match),
		partial: readCssVar(el, "--color-fabble-partial", FALLBACK_COLORS.partial),
		noMatch: readCssVar(el, "--color-fabble-no-match", FALLBACK_COLORS.noMatch),
		na: readCssVar(el, "--color-fabble-na", FALLBACK_COLORS.na),
	};
}

// ─── Layout constants ─────────────────────────────────────────────────────────
// ShareCard is a fixed-size canvas (CARD_SIZE×CARD_SIZE px) captured via snapdom.
//
// WHY pixel values throughout this component:
// This is not a normal UI component — it is rendered off-screen solely to be
// screenshot'd into a PNG. CSS flex/grid cannot guarantee pixel-perfect,
// consistent output across browsers and zoom levels when the target is a static
// image capture. Every spacing, font-size, and dimension value here is a
// deliberate design choice for the 540×540 card format, not a responsive layout.
//
// Values that control the grid math (PAD, TILE_GAP, CHROME_H) are defined as
// JS constants here so the arithmetic stays in one place. They are passed to
// inline styles at the usage site so the two can never drift apart. Pure
// decorative values (font sizes, border radius, letter-spacing) are expressed
// as Tailwind arbitrary classes since they don't feed into the tile calculation.

const CARD_SIZE = 540;
const PAD = 22;        // horizontal inset shared by separator, column labels, guess rows, and footer
const INNER_W = CARD_SIZE - PAD * 2;
const COLS = 11;
const TILE_GAP = 3;    // gap between tiles and between rows
const NUM_W = 14;      // width of the row-number gutter
const TILE_W = Math.floor((INNER_W - NUM_W - TILE_GAP - (COLS - 1) * TILE_GAP) / COLS);
const TILE_H = 22;     // default tile height; shrinks dynamically when there are many guesses
const ROW_GAP = 3;     // alias of TILE_GAP for vertical spacing — kept separate for clarity

// Conservative sum of all fixed chrome sections (px): header(130) + logo area(50) +
// separator(13) + score zone(50) + column labels(14) + footer(46).
// Used to derive the remaining vertical space available for guess rows.
const CHROME_H = 130 + 50 + 13 + 50 + 14 + 46;
const GRID_AVAIL = CARD_SIZE - CHROME_H;

function tileColor(colors: ShareCardColors, state: string, isWinningRow = false): string {
	if (isWinningRow) return colors.match;
	switch (state) {
		case "match":    return colors.match;
		case "partial":  return colors.partial;
		case "no-match": return colors.noMatch;
		case "na":       return colors.match;
		default:         return colors.tileEmpty;
	}
}

function rowStates(row: FeedbackRow): string[] {
	return [
		row.type.state,
		row.class.state,
		row.talent.state,
		row.pitch.state,
		row.cost.state,
		row.power.state,
		row.defense.state,
		row.lifeOrIntellect.state,
		row.subtype.state,
		row.keyword.state,
		row.set.state,
	];
}

interface ShareCardProps {
	guesses: GuessEntry[];
	mode: FabbleMode;
	date: string;
	guessLimit: number;
	won: boolean;
	username?: string;
	hintsUsed?: number;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
	({ guesses, mode, date, guessLimit, won, username, hintsUsed }, ref) => {
		const { t } = useTranslation("fabble");
		const rootRef = useRef<HTMLDivElement>(null);
		const [colors, setColors] = useState<ShareCardColors>(FALLBACK_COLORS);

		// Read CSS custom properties once the element is mounted under data-theme="dark"
		useLayoutEffect(() => {
			if (rootRef.current) {
				setColors(readThemeColors(rootRef.current));
			}
		}, []);

		const modeLabel = `${t(FabbleModes[mode])} ${t("mode.suffix")}`;
		const scoreText = won ? `${guesses.length}/${guessLimit}` : `X/${guessLimit}`;

		// Shrink tile height when many guesses would push the footer off-card.
		const n = guesses.length;
		const naturalGridH = n * TILE_H + Math.max(0, n - 1) * ROW_GAP;
		const effectiveTileH = naturalGridH <= GRID_AVAIL
			? TILE_H
			: Math.max(12, Math.floor((GRID_AVAIL - Math.max(0, n - 1) * ROW_GAP) / n));

		const colLabels = useMemo(() => [
			t("column_abbr.type"),
			t("column_abbr.class"),
			t("column_abbr.talent"),
			t("column_abbr.pitch"),
			t("column_abbr.cost"),
			t("column_abbr.power"),
			t("column_abbr.defense"),
			t("column_abbr.life_intellect"),
			t("column_abbr.subtype"),
			t("column_abbr.keyword"),
			t("column_abbr.set"),
		], [t]);

		// Merge the forwarded ref with our internal rootRef.
		// useCallback prevents a detach/reattach cycle on every re-render.
		const setRefs = useCallback((el: HTMLDivElement | null) => {
			rootRef.current = el;
			if (typeof ref === "function") ref(el);
			else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
		}, [ref]);

		return (
			<div
				ref={setRefs}
				data-theme="dark"
				className="relative box-border antialiased flex flex-col overflow-hidden"
				style={{
					width: CARD_SIZE,
					height: CARD_SIZE,
					backgroundColor: colors.bg,
				}}
			>
				{/* ── Header banner ── */}
				{/* h-[130px] matches the CHROME_H header term (130) — keep in sync */}
				<div
					className="shrink-0 relative overflow-hidden h-[130px]"
					style={{ backgroundColor: colors.bg }}
				>
					{/* Meeps art — both meep characters visible */}
					<img
						src="/img/Mischievous-Meeps.png"
						alt="Mischievous Meeps artwork"
						aria-hidden="true"
						className="absolute inset-0 w-full h-full object-cover object-[47%_33%] opacity-75"
					/>
					{/* Left vignette — fades gently so more art shows through */}
					<div
						className="absolute inset-0"
						style={{ background: `linear-gradient(to right, ${colors.bg} 0%, transparent 45%)` }}
					/>
					{/* Bottom vignette — blends into the card body */}
					<div
						className="absolute inset-0"
						style={{ background: `linear-gradient(to top, ${colors.bg} 0%, transparent 50%)` }}
					/>
					{/* Mode / date badge */}
					{/* text-[11px]: no named Tailwind equivalent for this screenshot-card size */}
					<div
						className="absolute top-3 left-3.5 text-[11px] font-semibold"
						style={{ color: colors.muted }}
					>
						{modeLabel} · {date}
					</div>
				</div>

				{/* ── Fabble logo ── */}
				{/* h-[38px]: logo target height for this card size; py-1.5 × 2 + 38 ≈ CHROME_H logo term (50) */}
				<div className="flex justify-center shrink-0 py-1.5">
					<img
						src="/FabbleLogo.svg"
						alt="Fabble"
						className="h-[38px] w-auto"
					/>
				</div>

				{/* ── Separator ── */}
				{/* mx uses PAD inline so it stays in sync with the grid math constant */}
				<div
					className="shrink-0 h-px mb-3"
					style={{ marginLeft: PAD, marginRight: PAD, backgroundColor: colors.separator }}
				/>

				{/* ── Score zone ── */}
				<div className="flex flex-col items-center shrink-0 gap-1 mb-3.5 px-2">
					{/* text-[Npx] sizes below: Tailwind named scale (e.g. text-lg=18px, text-sm=14px) */}
					{/* doesn't align to these values; pixel-exact sizing is required for the card format */}
					{username && (
						<span
							className="font-bold text-[17px] leading-[1.2]"
							style={{ color: colors.accent }}
						>
							{username}
						</span>
					)}
					<span
						className="text-[13px] leading-[1.4]"
						style={{ color: colors.heading }}
					>
						{won
							? <>{t("share.solved_in")}&nbsp;<strong style={{ color: colors.accent }}>{scoreText}</strong></>
							: <>{t("share.played_today")}&nbsp;<strong style={{ color: colors.subtle }}>{scoreText}</strong></>
						}
					</span>
					{hintsUsed !== undefined && (
						<span className="text-[11px]" style={{ color: colors.muted }}>
							{t("share.hints_used", { count: hintsUsed })}
						</span>
					)}
				</div>

				{/* ── Column labels ── */}
				{/* gap and px use TILE_GAP / PAD inline to stay in sync with tile math */}
				<div className="flex shrink-0 mb-1" style={{ gap: TILE_GAP, paddingLeft: PAD, paddingRight: PAD }}>
					<div style={{ width: NUM_W, minWidth: NUM_W }} />
					{colLabels.map((label) => (
						<div
							key={label}
							className="text-center uppercase font-semibold text-[7px] tracking-[0.04em]" /* px sizes: screenshot-card design; no named Tailwind equivalent */
							style={{
								width: TILE_W,
								minWidth: TILE_W,
								color: colors.subtle,
							}}
						>
							{label}
						</div>
					))}
				</div>

				{/* ── Guess rows ── */}
				{/* gap and px use ROW_GAP / PAD inline to stay in sync with tile math */}
				<div className="flex flex-col shrink-0" style={{ gap: ROW_GAP, paddingLeft: PAD, paddingRight: PAD }}>
					{guesses.map((g, ri) => {
						const isWinningRow = won && ri === guesses.length - 1;
						return (
							<div key={g.name} className="flex items-center" style={{ gap: TILE_GAP }}>
								<div
									className="text-center font-bold shrink-0 text-[8px]"
									style={{ width: NUM_W, minWidth: NUM_W, color: colors.subtle }}
								>
									{ri + 1}
								</div>
								{rowStates(g.feedbackRow).map((state, ci) => (
									<div
										key={`${g.name}-col-${ci}`}
										className="rounded-[3px]"
										style={{
											width: TILE_W,
											minWidth: TILE_W,
											height: effectiveTileH,
											backgroundColor: tileColor(colors, state, isWinningRow),
										}}
									/>
								))}
							</div>
						);
					})}
				</div>

				{/* ── Spacer ── */}
				<div className="flex-1" />

				{/* ── Footer ── */}
				{/* pt/pb/px are part of the CHROME_H footer term (46px); px matches PAD */}
				<div className="flex flex-col items-center justify-center shrink-0 gap-1" style={{ paddingTop: 10, paddingBottom: 14, paddingLeft: PAD, paddingRight: PAD }}>
					<span className="text-[11px]" style={{ color: colors.subtle }}>
						{t("share.tagline")}
					</span>
					<div className="flex items-center gap-1.5">
						<img src={FabkitIconSrc} alt="" className="size-3.5" />
						<span
							className="font-bold text-[11px]"
							style={{ color: colors.accent }}
						>
							{t("share.powered_by")}
						</span>
					</div>
				</div>
			</div>
		);
	},
);

ShareCard.displayName = "ShareCard";
