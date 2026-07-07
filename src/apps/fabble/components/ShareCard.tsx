import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import FabkitIcon from "../../../assets/Fabkitlogo_notext.svg";
import type { GuessResult } from "../types";
import { COLUMNS } from "../types";

const SHARE_FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";

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
		const tileWidth = rows.length > 8 ? 42 : 62;
		const tileHeight = rows.length > 8 ? 24 : 36;

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
					fontFamily: SHARE_FONT_FAMILY,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "relative",
						height: 190,
						backgroundImage: "url(/img/fabble/Mischievous-Meeps.webp)",
						backgroundSize: "cover",
						backgroundPosition: "center 30%",
					}}
				>
					<div
						style={{
							position: "absolute",
							inset: 0,
							backgroundColor: "rgba(29,29,29,0.18)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: 0,
							background:
								"linear-gradient(to bottom, transparent 0%, rgba(29,29,29,0.05) 35%, rgba(29,29,29,0.25) 55%, rgba(29,29,29,0.55) 72%, rgba(29,29,29,0.82) 88%, rgba(29,29,29,0.97) 100%)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							top: 12,
							left: 16,
							fontWeight: "bold",
							fontSize: 15,
							color: COLORS.body,
						}}
					>
						{modeLabel} · {dateLabel}
					</div>
				</div>

				<div
					style={{
						position: "relative",
						zIndex: 1,
						display: "flex",
						justifyContent: "center",
						marginTop: -24,
					}}
				>
					<img src="/img/fabble/FabbleLogo.svg" alt="" style={{ height: 58 }} />
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
								fontSize: 20,
								marginBottom: 6,
							}}
						>
							{username}
						</div>
					)}
					<div style={{ fontSize: 16 }}>
						{won
							? t("share.result_solved", {
									score: `${guessCount}/${maxGuesses}`,
								})
							: t("share.result_failed")}
					</div>
					{hintsUsed > 0 && (
						<div style={{ color: COLORS.muted, fontSize: 14 }}>
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
					<div style={{ display: "flex", gap: 6, paddingLeft: 26 }}>
						{COLUMNS.map((column) => (
							<span
								key={column}
								style={{
									width: tileWidth,
									fontSize: 10,
									fontWeight: "bold",
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
							style={{ display: "flex", gap: 6, alignItems: "center" }}
						>
							<span style={{ width: 20, fontSize: 12, color: COLORS.muted }}>
								{rowIndex + 1}
							</span>
							{result.columns.map((col) => (
								<span
									key={col.column}
									style={{
										width: tileWidth,
										height: tileHeight,
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
						fontSize: 15,
					}}
				>
					<div style={{ color: COLORS.muted }}>{t("share.footer_line")}</div>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							gap: 6,
							marginTop: 6,
						}}
					>
						<img src={FabkitIcon} alt="" style={{ height: 19, width: 19 }} />
						<span style={{ color: COLORS.heading, fontWeight: "bold" }}>
							{t("share.footer_brand")}
						</span>
					</div>
				</div>
			</div>
		);
	},
);
