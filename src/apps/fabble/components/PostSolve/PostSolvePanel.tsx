import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CardRarities, type CardRarity } from "@fabkit/shared/config/cards/rarities";
import { DISPLAY_TO_RARITY } from "@fabkit/apps/fabble/lib/rarityUtils";
import { useShareImage } from "@fabkit/apps/fabble/hooks/useShareImage";
import { GUESS_LIMITS } from "@fabkit/apps/fabble/lib/constants";
import type {
	DailyCard,
	FabbleMode,
	GuessEntry,
	StreakData,
} from "@fabkit/apps/fabble/lib/types";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabbleStore";
import { CardReveal } from "./CardReveal";
import { Countdown } from "./Countdown";
import { ShareCard } from "./ShareCard";
import { StreakStats } from "./StreakStats";

interface PostSolvePanelProps {
	daily: DailyCard;
	guesses: GuessEntry[];
	hasWon: boolean;
	streak: StreakData;
	mode: FabbleMode;
}

// Re-use the shared display→slug mapping rather than duplicating it
const RARITY_SLUG = DISPLAY_TO_RARITY;

const MAIN_RARITY_SLUGS: CardRarity[] = ["fabled", "legendary", "majestic", "superrare", "rare", "common"];

function getPrimaryRarity(rarities: string[]): string | null {
	if (rarities.length === 0) return null;
	const primarySlug = MAIN_RARITY_SLUGS.find((slug) =>
		rarities.some((r) => RARITY_SLUG[r] === slug),
	);
	if (primarySlug) return rarities.find((r) => RARITY_SLUG[r] === primarySlug) ?? null;
	return rarities[0] ?? null;
}

export function PostSolvePanel({
	daily,
	guesses,
	hasWon,
	streak,
	mode,
}: PostSolvePanelProps) {
	const { t } = useTranslation("fabble");
	const navigate = useNavigate();
	const guessLimit = GUESS_LIMITS[mode];
	const _d = new Date();
	const date = `${String(_d.getDate()).padStart(2, "0")}-${String(_d.getMonth() + 1).padStart(2, "0")}-${String(_d.getFullYear()).slice(2)}`;
	const revealedHintCount = useFabbleStore((s) => s.revealedHintCount);

	const { cardRef, username, setUsername, capturing, shareImage } =
		useShareImage();

	const winMessage =
		guesses.length === 1
			? t("result.won_one")
			: t("result.won_other", { count: guesses.length });

	const primaryRarity = getPrimaryRarity(daily.rarities);
	const primaryRaritySlug = primaryRarity ? RARITY_SLUG[primaryRarity] : null;
	const primaryArtist = daily.artists?.[0];

	return (
		<div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4 py-6">
			{/* Card identity: image + meta side by side */}
			<div className="flex flex-col sm:flex-row items-start gap-8 w-full">
				<CardReveal daily={daily} won={hasWon} />

				<div className="flex flex-col gap-2.5 min-w-0 pt-1">
					<h2 className="text-2xl font-bold text-heading leading-tight">
						{daily.name}
					</h2>

					{primaryRarity && primaryRaritySlug && (
						<div className="flex items-center gap-1.5">
							<img
								src={CardRarities[primaryRaritySlug].icon}
								alt=""
								aria-hidden="true"
								className="size-5 shrink-0"
							/>
							<span className="text-sm text-muted">
								{t(`rarity.${primaryRaritySlug}`)}
							</span>
						</div>
					)}

					{daily.sets.length > 0 && (
						<div className="flex flex-col gap-0.5">
							{[...daily.sets].reverse().map((set) => (
								<span key={set} className="text-sm text-muted">
									{set}
								</span>
							))}
							{daily.pitchVariantImage && (
								<span className="text-xs text-subtle">
									{daily.pitchVariantImage}
								</span>
							)}
						</div>
					)}

					{primaryArtist && (
						<span className="text-xs text-subtle">
							{t("result.art_by", { artist: primaryArtist })}
						</span>
					)}
				</div>
			</div>

			{/* Result message */}
			<div className="flex flex-col items-center gap-2 text-center">
				<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-white">
					{mode === "standard"
						? t("puzzle.mode_label_standard")
						: t("puzzle.mode_label_chaos")}
				</span>
				{hasWon ? (
					<p className="text-sm font-medium text-body">{winMessage}</p>
				) : (
					<>
						<p className="text-sm font-medium text-body">
							{t("result.lost")}
						</p>
						<p className="text-sm text-muted">
							{t("result.card_was", { name: daily.name })}
						</p>
					</>
				)}
			</div>

			<StreakStats streak={streak} />

			{/* ── Share image section ── */}
			<div className="flex flex-col items-center gap-3 w-full">
				{/* Optional username input */}
				<div className="flex flex-col gap-1 w-full max-w-xs">
					<label className="text-xs text-muted text-center">
						{t("share.username_label")}{" "}
						<span className="text-subtle">({t("share.username_optional")})</span>
					</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder={t("share.username_placeholder")}
						maxLength={20}
						className="w-full px-3 py-2 text-sm rounded-md border border-border-primary bg-surface-muted text-body placeholder:text-subtle text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
					<p className="text-[11px] text-subtle text-center">
						{t("share.username_note")}
					</p>
				</div>

				<button
					type="button"
					onClick={shareImage}
					disabled={capturing}
					className="min-h-11 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait"
				>
					{capturing ? t("share.generating") : t("share.share_result")}
				</button>
			</div>

			<Countdown onExpired={() => navigate({ to: "/fabble/$mode", params: { mode } })} />

			{/* ── Off-screen ShareCard (captured by snapdom) ── */}
			<div
				aria-hidden="true"
				style={{
					position: "fixed",
					left: -1200,
					top: 0,
					pointerEvents: "none",
					zIndex: -1,
				}}
			>
				<ShareCard
					ref={cardRef}
					guesses={guesses}
					mode={mode}
					date={date}
					guessLimit={guessLimit}
					won={hasWon}
					username={username || undefined}
					hintsUsed={mode === "standard" ? revealedHintCount : undefined}
				/>
			</div>
		</div>
	);
}
