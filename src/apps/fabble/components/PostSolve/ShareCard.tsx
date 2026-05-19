import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from "react";
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

function readCssVar(el: Element, name: string): string {
	return getComputedStyle(el).getPropertyValue(name).trim();
}

function readThemeColors(el: Element): ShareCardColors {
	return {
		bg: readCssVar(el, "--color-surface") || FALLBACK_COLORS.bg,
		surface: readCssVar(el, "--color-surface-muted") || FALLBACK_COLORS.surface,
		accent: readCssVar(el, "--color-primary") || FALLBACK_COLORS.accent,
		heading: readCssVar(el, "--color-heading") || FALLBACK_COLORS.heading,
		muted: readCssVar(el, "--color-muted") || FALLBACK_COLORS.muted,
		subtle: readCssVar(el, "--color-subtle") || FALLBACK_COLORS.subtle,
		separator: readCssVar(el, "--color-border-primary") || FALLBACK_COLORS.separator,
		tileEmpty: readCssVar(el, "--color-fabble-empty") || FALLBACK_COLORS.tileEmpty,
		tileEmptyBorder: readCssVar(el, "--color-fabble-border") || FALLBACK_COLORS.tileEmptyBorder,
		match: readCssVar(el, "--color-fabble-match") || FALLBACK_COLORS.match,
		partial: readCssVar(el, "--color-fabble-partial") || FALLBACK_COLORS.partial,
		noMatch: readCssVar(el, "--color-fabble-no-match") || FALLBACK_COLORS.noMatch,
		na: readCssVar(el, "--color-fabble-na") || FALLBACK_COLORS.na,
	};
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_SIZE = 540;
const PAD = 22;
const INNER_W = CARD_SIZE - PAD * 2;
const COLS = 11;
const TILE_GAP = 3;
const NUM_W = 14;
const TILE_W = Math.floor((INNER_W - NUM_W - TILE_GAP - (COLS - 1) * TILE_GAP) / COLS);
const TILE_H = 22;
const ROW_GAP = 3;

function tileColor(C: ShareCardColors, state: string, isWinningRow = false): string {
	if (isWinningRow) return C.match;
	switch (state) {
		case "match":    return C.match;
		case "partial":  return C.partial;
		case "no-match": return C.noMatch;
		case "na":       return C.match;
		default:         return C.tileEmpty;
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
		const [C, setC] = useState<ShareCardColors>(FALLBACK_COLORS);

		// Read CSS custom properties once the element is mounted under data-theme="dark"
		useLayoutEffect(() => {
			if (rootRef.current) {
				setC(readThemeColors(rootRef.current));
			}
		}, []);

		const modeLabel = t(FabbleModes[mode]);
		const scoreText = won ? `${guesses.length}/${guessLimit}` : `X/${guessLimit}`;

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

		// Merge the forwarded ref with our internal rootRef
		function setRefs(el: HTMLDivElement | null) {
			rootRef.current = el;
			if (typeof ref === "function") ref(el);
			else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
		}

		return (
			<div
				ref={setRefs}
				data-theme="dark"
				className="flex flex-col overflow-hidden"
				style={{
					width: CARD_SIZE,
					height: CARD_SIZE,
					backgroundColor: C.bg,
					boxSizing: "border-box",
					WebkitFontSmoothing: "antialiased",
					position: "relative",
				}}
			>
				{/* ── Header banner ── */}
				<div
					className="flex items-center justify-center shrink-0 relative overflow-hidden"
					style={{ height: 80, backgroundColor: C.surface }}
				>
					<img
						src="/img/Mischievous-Meeps.png"
						alt=""
						aria-hidden="true"
						className="absolute inset-0 w-full h-full object-cover object-top opacity-40"
					/>
					<div
						className="absolute top-2.5 right-3.5 rounded-full"
						style={{
							backgroundColor: "rgba(0,0,0,0.55)",
							padding: "3px 10px",
							fontSize: 11,
							color: C.muted,
						}}
					>
						{modeLabel} · {date}
					</div>
				</div>

				{/* ── Fabble logo ── */}
				<div className="flex justify-center shrink-0 py-1.5">
					<img
						src="/FabbleLogo.svg"
						alt="Fabble"
						style={{ height: 38, width: "auto" }}
					/>
				</div>

				{/* ── Separator ── */}
				<div
					className="shrink-0"
					style={{ height: 1, backgroundColor: C.separator, margin: `0 ${PAD}px 12px` }}
				/>

				{/* ── Score zone ── */}
				<div className="flex flex-col items-center shrink-0 gap-1 mb-3.5 px-2">
					{username && (
						<span style={{ color: C.accent, fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
							{username}
						</span>
					)}
					<span style={{ color: C.heading, fontSize: 13, lineHeight: 1.4 }}>
						{won
							? <>{t("share.solved_in") + " "}<strong style={{ color: C.accent }}>{scoreText}</strong></>
							: <>{t("share.played_today") + " "}<strong style={{ color: C.subtle }}>{scoreText}</strong></>
						}
					</span>
					{hintsUsed !== undefined && (
						<span style={{ color: C.muted, fontSize: 11 }}>
							{t("share.hints_used", { count: hintsUsed })}
						</span>
					)}
				</div>

				{/* ── Column labels ── */}
				<div className="flex shrink-0 mb-1" style={{ gap: TILE_GAP, padding: `0 ${PAD}px` }}>
					<div style={{ width: NUM_W, minWidth: NUM_W }} />
					{colLabels.map((label) => (
						<div
							key={label}
							className="text-center uppercase font-semibold"
							style={{
								width: TILE_W,
								minWidth: TILE_W,
								fontSize: 7,
								color: C.subtle,
								letterSpacing: "0.04em",
							}}
						>
							{label}
						</div>
					))}
				</div>

				{/* ── Guess rows ── */}
				<div className="flex flex-col shrink-0" style={{ gap: ROW_GAP, padding: `0 ${PAD}px` }}>
					{guesses.map((g, ri) => {
						const isWinningRow = won && ri === guesses.length - 1;
						return (
							<div key={ri} className="flex items-center" style={{ gap: TILE_GAP }}>
								<div
									className="text-center font-bold shrink-0"
									style={{ width: NUM_W, minWidth: NUM_W, fontSize: 8, color: C.subtle }}
								>
									{ri + 1}
								</div>
								{rowStates(g.feedbackRow).map((state, ci) => (
									<div
										key={ci}
										style={{
											width: TILE_W,
											minWidth: TILE_W,
											height: TILE_H,
											borderRadius: 3,
											backgroundColor: tileColor(C, state, isWinningRow),
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
				<div
					className="flex items-center justify-center shrink-0 gap-1.5"
					style={{ padding: `10px ${PAD}px 14px` }}
				>
					<img src={FabkitIconSrc} alt="" style={{ height: 18, width: 18 }} />
					<span style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>
						fabkit.io/fabble
					</span>
					<span style={{ color: C.subtle, fontSize: 11, marginLeft: 2 }}>
						· {t("share.tagline")}
					</span>
				</div>
			</div>
		);
	},
);
