import { useTranslation } from "react-i18next";
import { useShareImage } from "../../hooks/useShareImage";
import { GUESS_LIMITS } from "../../lib/constants";
import type {
	DailyCard,
	FabbleMode,
	GuessEntry,
	StreakData,
} from "../../lib/types";
import { useFabbleStore } from "../../stores/fabbleStore";
import { CardReveal } from "./CardReveal";
import { Countdown } from "./Countdown";
import { ShareCard } from "./ShareCard";
import { StreakStats } from "./StreakStats";

interface PostSolvePanelProps {
	daily: DailyCard;
	guesses: GuessEntry[];
	status: "won" | "lost";
	streak: StreakData;
	mode: FabbleMode;
}

const RARITY_SLUG: Record<string, string> = {
	Common: "common",
	Rare: "rare",
	"Super Rare": "superrare",
	Majestic: "majestic",
	Legendary: "legendary",
	Fabled: "fabled",
	Marvel: "marvel",
	Promo: "promo",
	Token: "token",
	"Basic Non-Premium": "basic",
};

const MAIN_RARITIES = ["Fabled", "Legendary", "Majestic", "Super Rare", "Rare", "Common"];

function getPrimaryRarity(rarities: string[]): string | undefined {
	return (
		MAIN_RARITIES.find((r) => rarities.includes(r)) ?? rarities[0]
	);
}

function getRarityImagePath(rarity: string): string {
	const slug = RARITY_SLUG[rarity] ?? rarity.toLowerCase().replace(/\s+/g, "");
	return `/img/rarities/rarity_${slug}.svg`;
}

export function PostSolvePanel({
	daily,
	guesses,
	status,
	streak,
	mode,
}: PostSolvePanelProps) {
	const { t } = useTranslation("fabble");
	const won = status === "won";
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
	const primaryArtist = daily.artists?.[0];

	return (
		<div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4 py-6">
			{/* Card identity: image + meta side by side */}
			<div className="flex flex-col sm:flex-row items-start gap-8 w-full">
				<CardReveal daily={daily} won={won} />

				<div className="flex flex-col gap-2.5 min-w-0 pt-1">
					<h2 className="text-2xl font-bold text-heading leading-tight">
						{daily.name}
					</h2>

					{primaryRarity && (
						<div className="flex items-center gap-1.5">
							<img
								src={getRarityImagePath(primaryRarity)}
								alt=""
								aria-hidden="true"
								className="size-5 shrink-0"
							/>
							<span className="text-sm text-muted">{primaryRarity}</span>
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
				{won ? (
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
						Add your name to the share card{" "}
						<span className="text-subtle">(optional)</span>
					</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Your name or @handle"
						maxLength={20}
						className="w-full px-3 py-2 text-sm rounded-md border border-border-primary bg-surface-muted text-body placeholder:text-subtle text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
					<p className="text-[11px] text-subtle text-center">
						Saved for next time · not stored anywhere else
					</p>
				</div>

				<button
					type="button"
					onClick={shareImage}
					disabled={capturing}
					className="min-h-[44px] px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait"
				>
					{capturing ? "Generating…" : "Share Result"}
				</button>
			</div>

			<Countdown onExpired={() => window.location.reload()} />

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
					won={won}
					username={username || undefined}
					hintsUsed={mode === "standard" ? revealedHintCount : undefined}
				/>
			</div>
		</div>
	);
}


