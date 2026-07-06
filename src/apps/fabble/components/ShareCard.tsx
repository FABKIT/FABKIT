import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import type { GuessResult } from "../types";
import { COLUMNS } from "../types";

/** The share card is a static PNG capture of the brand, not a themed UI surface —
    it must always render dark regardless of the site's light/dark setting, so it
    uses literal colors here instead of the theme-reactive semantic tokens. */
const COLORS = {
	bg: "#1d1d1d",
	surface: "#2a2a2a",
	heading: "#d4af5a",
	body: "#f5f5f5",
	muted: "rgba(245,245,245,0.6)",
	border: "rgba(212,175,90,0.3)",
	match: "#3fae62",
	partial: "#d3cc4a",
	miss: "#d34b50",
};

const COLUMN_INITIALS: Record<(typeof COLUMNS)[number], string> = {
	type: "TYPE",
	class: "CLASS",
	talent: "TAL",
	pitch: "PITCH",
	cost: "COST",
	power: "PWR",
	defense: "DEF",
	life: "L/I",
	subtypes: "SUB",
	keywords: "KW",
	set: "SET",
};

interface ShareCardProps {
	modeLabel: string;
	dateLabel: string;
	username: string;
	won: boolean;
	guessCount: number;
	maxGuesses: number;
	hintsUsed: number;
	rows: GuessResult[];
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
	function ShareCard(
		{
			modeLabel,
			dateLabel,
			username,
			won,
			guessCount,
			maxGuesses,
			hintsUsed,
			rows,
		},
		ref,
	) {
		const { t } = useTranslation("fabble");
		const squareSize = rows.length > 8 ? 32 : 52;

		return (
			<div
				ref={ref}
				style={{
					position: "fixed",
					left: -10000,
					top: 0,
					width: 864,
					height: 864,
					backgroundColor: COLORS.bg,
					color: COLORS.body,
					fontFamily: "sans-serif",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "relative",
						height: 190,
						backgroundImage: "url(/img/fabble/Mischievous-Meeps.webp)",
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					<div
						style={{
							position: "absolute",
							inset: 0,
							background:
								"linear-gradient(to bottom, transparent, rgba(29,29,29,0.9))",
						}}
					/>
					<div
						style={{
							position: "absolute",
							top: 12,
							left: 16,
							fontWeight: "bold",
							fontSize: 14,
							color: COLORS.body,
						}}
					>
						{modeLabel} · {dateLabel}
					</div>
				</div>

				<div
					style={{ display: "flex", justifyContent: "center", marginTop: -20 }}
				>
					<img src="/img/fabble/FabbleLogo.svg" alt="" style={{ height: 48 }} />
				</div>

				<div
					style={{
						height: 1,
						background: COLORS.border,
						margin: "12px 48px",
					}}
				/>

				<div style={{ textAlign: "center", padding: "0 32px" }}>
					{username && (
						<div
							style={{
								color: COLORS.heading,
								fontWeight: "bold",
								marginBottom: 4,
							}}
						>
							{username}
						</div>
					)}
					<div>
						{won
							? t("share.result_solved", {
									score: `${guessCount}/${maxGuesses}`,
								})
							: t("share.result_failed")}
					</div>
					{hintsUsed > 0 && (
						<div style={{ color: COLORS.muted, fontSize: 13 }}>
							{t("hints.used", { used: hintsUsed })}
						</div>
					)}
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 4,
						padding: "16px 32px",
					}}
				>
					<div style={{ display: "flex", gap: 4, paddingLeft: 24 }}>
						{COLUMNS.map((column) => (
							<span
								key={column}
								style={{
									width: squareSize,
									fontSize: 9,
									textAlign: "center",
									color: COLORS.muted,
									textTransform: "uppercase",
								}}
							>
								{COLUMN_INITIALS[column]}
							</span>
						))}
					</div>
					{rows.map((result, rowIndex) => (
						<div
							key={result.guessId}
							style={{ display: "flex", gap: 4, alignItems: "center" }}
						>
							<span style={{ width: 20, fontSize: 11, color: COLORS.muted }}>
								{rowIndex + 1}
							</span>
							{result.columns.map((col) => (
								<span
									key={col.column}
									style={{
										width: squareSize,
										height: squareSize,
										borderRadius: 6,
										backgroundColor: COLORS[col.state],
									}}
								/>
							))}
						</div>
					))}
				</div>

				<div
					style={{
						position: "absolute",
						bottom: 16,
						left: 0,
						right: 0,
						textAlign: "center",
						fontSize: 12,
					}}
				>
					<span style={{ color: COLORS.muted }}>{t("share.footer_line")}</span>
					{" · "}
					<span style={{ color: COLORS.heading, fontWeight: "bold" }}>
						{t("share.footer_brand")}
					</span>
				</div>
			</div>
		);
	},
);
