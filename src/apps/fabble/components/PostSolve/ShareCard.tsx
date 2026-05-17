import { forwardRef } from "react";
import FabkitIconSrc from "../../../../assets/Fabkitlogo_notext.svg?url";
import type { FabbleMode, FeedbackRow, GuessEntry } from "../../lib/types";

// ─── Design constants ─────────────────────────────────────────────────────────
// Matches the app's dark theme. Using hex literals so the share card looks
// identical regardless of the user's current light/dark preference.

const C = {
	bg: "#2a2a2a",
	surface: "#222222",
	accent: "#a6864a",
	accentLight: "#c2aa81",
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
} as const;

const CARD_SIZE = 540;
const PAD = 22;
const INNER_W = CARD_SIZE - PAD * 2;
const COLS = 11;
const TILE_GAP = 3;
const NUM_W = 14;
const TILE_W = Math.floor((INNER_W - NUM_W - TILE_GAP - (COLS - 1) * TILE_GAP) / COLS);
const TILE_H = 22;
const ROW_GAP = 3;

const COL_LABELS = ["Type", "Class", "Talent", "Pitch", "Cost", "Pwr", "Def", "L/INT", "Sub", "KW", "Set"];

function tileColor(state: string, isWinningRow = false): string {
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
	function ShareCard({ guesses, mode, date, guessLimit, won, username, hintsUsed }, ref) {
		const modeLabel = mode === "standard" ? "Standard" : "Chaos";
		const scoreText = won ? `${guesses.length}/${guessLimit}` : `X/${guessLimit}`;
		const emptyRows = 0; // show only played rows, not remaining empty slots
		const bannerH = 155;

		return (
			<div
				ref={ref}
				style={{
					width: CARD_SIZE,
					height: CARD_SIZE,
					backgroundColor: C.bg,
					fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					WebkitFontSmoothing: "antialiased",
					position: "relative",
				}}
			>
				{/* ── Meeps art banner ── */}
				<div style={{ position: "relative", height: bannerH, flexShrink: 0, overflow: "hidden" }}>
					<img
						src="/img/Mischievous-Meeps.png"
						alt=""
						style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
					/>
					{/* Gradient: transparent top → dark bottom */}
					<div style={{
						position: "absolute", inset: 0,
						background: `linear-gradient(to bottom, rgba(42,42,42,0.15) 0%, rgba(42,42,42,0.6) 65%, ${C.bg} 100%)`,
					}} />
					{/* Mode + date badge, top-right */}
					<div style={{
						position: "absolute", top: 10, right: 14,
						backgroundColor: "rgba(0,0,0,0.55)",
						borderRadius: 20,
						padding: "3px 10px",
						fontSize: 11,
						color: C.muted,
						backdropFilter: "blur(4px)",
					}}>
						{modeLabel} · {date}
					</div>
				</div>

				{/* ── Fabble logo ── */}
				<div style={{ display: "flex", justifyContent: "center", padding: "6px 0 10px", flexShrink: 0 }}>
					<img
						src="/FabbleLogo.svg"
						alt="Fabble"
						style={{ height: 38, width: "auto" }}
					/>
				</div>

				{/* ── Separator ── */}
				<div style={{ height: 1, backgroundColor: C.separator, margin: "0 PAD 12px".replace("PAD", String(PAD)), flexShrink: 0 }} />

				{/* ── Score zone ── */}
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 14, flexShrink: 0, padding: "0 8px" }}>
					{username && (
						<span style={{ color: C.accent, fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
							{username}
						</span>
					)}
					<span style={{ color: C.heading, fontSize: 13, lineHeight: 1.4 }}>
						{won
							? <>{`solved today's Fabble in `}<strong style={{ color: C.accent }}>{scoreText}</strong></>
							: <>{`played today's Fabble — `}<strong style={{ color: C.subtle }}>{scoreText}</strong></>
						}
					</span>
					{hintsUsed !== undefined && (
						<span style={{ color: C.muted, fontSize: 11 }}>
							{`Hints used: ${hintsUsed}/2`}
						</span>
					)}
				</div>

				{/* ── Column labels ── */}
				<div style={{ display: "flex", gap: TILE_GAP, padding: `0 ${PAD}px`, marginBottom: 4, flexShrink: 0 }}>
					{/* Spacer for the number column */}
					<div style={{ width: NUM_W, minWidth: NUM_W }} />
					{COL_LABELS.map((label) => (
						<div key={label} style={{
							width: TILE_W, minWidth: TILE_W,
							fontSize: 7, color: C.subtle,
							textAlign: "center", textTransform: "uppercase",
							letterSpacing: "0.04em", fontWeight: 600,
						}}>
							{label}
						</div>
					))}
				</div>

				{/* ── Guess rows ── */}
				<div style={{ display: "flex", flexDirection: "column", gap: ROW_GAP, padding: `0 ${PAD}px`, flexShrink: 0 }}>
					{guesses.map((g, ri) => {
						const isWinningRow = won && ri === guesses.length - 1;
						return (
							<div key={ri} style={{ display: "flex", gap: TILE_GAP, alignItems: "center" }}>
								{/* Row number */}
								<div style={{
									width: NUM_W, minWidth: NUM_W,
									fontSize: 8, color: C.subtle,
									textAlign: "center", fontWeight: 700,
									flexShrink: 0,
								}}>
									{ri + 1}
								</div>
								{rowStates(g.feedbackRow).map((state, ci) => (
									<div key={ci} style={{
										width: TILE_W, minWidth: TILE_W, height: TILE_H,
										borderRadius: 3, backgroundColor: tileColor(state, isWinningRow),
									}} />
								))}
							</div>
						);
					})}
					{Array.from({ length: emptyRows }).map((_, ri) => (
						<div key={`e${ri}`} style={{ display: "flex", gap: TILE_GAP }}>
							{Array.from({ length: COLS }).map((_, ci) => (
								<div key={ci} style={{
									width: TILE_W, minWidth: TILE_W, height: TILE_H,
									borderRadius: 3, backgroundColor: C.tileEmpty,
									border: `1px solid ${C.tileEmptyBorder}`,
									boxSizing: "border-box", opacity: 0.5,
								}} />
							))}
						</div>
					))}
				</div>

				{/* ── Spacer ── */}
				<div style={{ flex: 1 }} />

				{/* ── Footer ── */}
				<div style={{
					display: "flex", alignItems: "center", justifyContent: "center",
					gap: 7, padding: `10px ${PAD}px 14px`, flexShrink: 0,
				}}>
					<img src={FabkitIconSrc} alt="" style={{ height: 18, width: 18 }} />
					<span style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>
						fabkit.io/fabble
					</span>
					<span style={{ color: C.subtle, fontSize: 11, marginLeft: 2 }}>
						· A daily Flesh and Blood deduction puzzle
					</span>
				</div>
			</div>
		);
	},
);


