import { Countdown } from "@fabkit/apps/fabble/components/Countdown";
import { ShareBlock } from "@fabkit/apps/fabble/components/ShareBlock";
import type { FabbleMode } from "@fabkit/apps/fabble/config";
import { earliestRegularPrinting } from "@fabkit/apps/fabble/game/compare";
import type { ModeSession } from "@fabkit/apps/fabble/stores/fabble";
import type { FabbleCard, PersistedStreaks } from "@fabkit/apps/fabble/types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useTranslation } from "react-i18next";

export interface EndPanelProps {
	mode: FabbleMode;
	session: ModeSession;
	answer: FabbleCard;
	streaks: PersistedStreaks;
	today: Date;
	onNewDay: () => void;
}

export function EndPanel({
	mode,
	session,
	answer,
	streaks,
	today,
	onNewDay,
}: EndPanelProps) {
	const { t } = useTranslation("fabble");
	const won = session.status === "won";
	const set = earliestRegularPrinting(answer);

	return (
		<div className="fabble-fade-in flex w-full max-w-140 flex-col items-center gap-3">
			<h2
				className={`fabble-heading-bounce mt-4 text-3xl font-extrabold uppercase tracking-wide ${won ? "text-fabble-victory" : "text-fabble-defeat"}`}
			>
				{won ? t("end.victory") : t("end.defeat")}
			</h2>

			<div className="mt-6 flex w-full flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center sm:gap-10">
				<div className="relative w-64 shrink-0">
					<img
						src={answer.imageUrl}
						alt={answer.name}
						crossOrigin="anonymous"
						className="fabble-card-reveal w-64 rounded-lg"
					/>
					<div
						className={`fabble-glow-layer ${won ? "fabble-glow-layer--victory" : "fabble-glow-layer--defeat"}`}
					/>
				</div>
				<div className="fabble-card-reveal flex flex-col items-center gap-1 sm:items-start">
					<span className="text-lg font-bold text-heading">{answer.name}</span>
					<span className="flex items-center gap-1.5 text-sm text-body">
						<img
							src={CardRarities[answer.rarity].icon}
							alt=""
							className="h-4 w-4"
						/>
						{t(`rarity.${answer.rarity}`)}
					</span>
					<span className="text-sm text-body">{set.name}</span>
					<span className="text-xs text-muted">
						{t("end.art_by", { artist: answer.artist })}
					</span>
				</div>
			</div>

			<span className="mt-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white">
				{t(`play.mode_badge_${mode}`)}
			</span>

			<p className="text-sm text-body">
				{won
					? t("end.solved_in", { count: session.guesses.length })
					: t("end.defeat_reveal", { name: answer.name })}
			</p>

			<div className="flex gap-6">
				<div className="flex flex-col items-center">
					<span className="text-xl font-bold text-heading">
						{streaks.current}
					</span>
					<span className="text-xs text-muted">{t("end.streak_current")}</span>
				</div>
				<div className="flex flex-col items-center">
					<span className="text-xl font-bold text-heading">{streaks.best}</span>
					<span className="text-xs text-muted">{t("end.streak_best")}</span>
				</div>
			</div>

			<ShareBlock mode={mode} session={session} today={today} />

			<Countdown onNewDay={onNewDay} />
		</div>
	);
}
