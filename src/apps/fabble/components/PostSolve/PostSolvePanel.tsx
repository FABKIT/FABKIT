import { useShareImage } from "@fabkit/apps/fabble/hooks/useShareImage";
import { GUESS_LIMITS } from "@fabkit/apps/fabble/lib/constants";
import { DISPLAY_TO_RARITY } from "@fabkit/apps/fabble/lib/rarityUtils";
import type {
	DailyCard,
	FabbleMode,
	GuessEntry,
	StreakData,
} from "@fabkit/apps/fabble/lib/types";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabbleStore";
import {
	CardRarities,
	type CardRarity,
} from "@fabkit/shared/config/cards/rarities";
import { useNavigate } from "@tanstack/react-router";
import { Droplets, Sparkles } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
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

const MAIN_RARITY_SLUGS: CardRarity[] = [
	"fabled",
	"legendary",
	"majestic",
	"superrare",
	"rare",
	"common",
];

function getPrimaryRarity(rarities: string[]): string | null {
	if (rarities.length === 0) return null;
	const primarySlug = MAIN_RARITY_SLUGS.find((slug) =>
		rarities.some((r) => DISPLAY_TO_RARITY[r] === slug),
	);
	if (primarySlug)
		return rarities.find((r) => DISPLAY_TO_RARITY[r] === primarySlug) ?? null;
	return rarities[0] ?? null;
}

// ─── Card identity sub-component ─────────────────────────────────────────────

function RevealedCardMeta({ daily }: { daily: DailyCard }) {
	const { t } = useTranslation("fabble");
	const primaryRarity = getPrimaryRarity(daily.rarities);
	const primaryRaritySlug = primaryRarity
		? DISPLAY_TO_RARITY[primaryRarity]
		: null;
	const primaryArtist = daily.artists?.[0];

	return (
		<div className="flex flex-col sm:flex-row items-start gap-8 w-full">
			<CardReveal daily={daily} won />

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
					</div>
				)}

				{primaryArtist && (
					<span className="text-xs text-subtle">
						{t("result.art_by", { artist: primaryArtist })}
					</span>
				)}
			</div>
		</div>
	);
}

// ─── Main panel ───────────────────────────────────────────────────────────────

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
	const revealedHintCount = useFabbleStore((s) => s.revealedHintCount);
	const storeDate = useFabbleStore((s) => s.date); // YYYY-MM-DD UTC — stays in sync with the puzzle day

	const date = useMemo(() => {
		if (!storeDate) return "";
		const [year, month, day] = storeDate.split("-");
		return `${day}-${month}-${String(year).slice(2)}`;
	}, [storeDate]);

	const { cardRef, username, setUsername, capturing, shareImage } =
		useShareImage();

	const handleUsernameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value),
		[setUsername],
	);

	const winMessage =
		guesses.length === 1
			? t("result.won_one")
			: t("result.won_other", { count: guesses.length });

	return (
		<div className="flex flex-col items-center w-full max-w-lg mx-auto px-4 pt-2 pb-6">
			{/* Victory / Defeat banner */}
			<div className="flex justify-center w-full mb-8">
				{hasWon ? (
					<div className="fabble-result-banner flex items-center gap-3">
						<Sparkles className="fabble-sparkle-icon size-8 text-fabble-match" />
						<span className="text-4xl font-black tracking-tight uppercase text-fabble-match">
							{t("result.victory")}
						</span>
						<Sparkles className="fabble-sparkle-icon fabble-sparkle-icon--delayed size-8 text-fabble-match" />
					</div>
				) : (
					<div className="fabble-result-banner flex items-center gap-3">
						<Droplets className="fabble-teardrop-icon size-7 text-fabble-no-match" />
						<span className="text-4xl font-black tracking-tight uppercase text-fabble-no-match">
							{t("result.defeat")}
						</span>
						<Droplets className="fabble-teardrop-icon fabble-teardrop-icon--delayed size-7 text-fabble-no-match" />
					</div>
				)}
			</div>

			<RevealedCardMeta daily={daily} />

			{/* Result message + rest of content */}
			<div className="flex flex-col items-center gap-6 w-full mt-6">
				<div className="flex flex-col items-center gap-2 text-center">
					<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-on-primary">
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
					<div className="flex flex-col gap-1 w-full max-w-xs">
						<label className="text-xs text-muted text-center">
							{t("share.username_label")}{" "}
							<span className="text-subtle">
								({t("share.username_optional")})
							</span>
						</label>
						<input
							type="text"
							value={username}
							onChange={handleUsernameChange}
							placeholder={t("share.username_placeholder")}
							maxLength={20}
							className="w-full px-3 py-2 text-sm rounded-md border border-border-primary bg-surface-muted text-body placeholder:text-subtle text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
						/>
						<p className="text-xs text-subtle text-center">
							{t("share.username_note")}
						</p>
					</div>

					<button
						type="button"
						onClick={shareImage}
						disabled={capturing}
						className="min-h-11 px-6 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait"
					>
						{capturing ? t("share.generating") : t("share.share_result")}
					</button>
				</div>

				<Countdown
					onExpired={() => navigate({ to: "/fabble/$mode", params: { mode } })}
				/>
			</div>
			{/* end gap-6 content wrapper */}

			{/* ── Off-screen ShareCard (captured by snapdom) ── */}
			<div
				aria-hidden="true"
				className="fixed -left-[1200px] top-0 z-[-1] pointer-events-none"
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
