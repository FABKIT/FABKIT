import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useTranslation } from "react-i18next";
import type { FabbleMode } from "../config";
import { earliestRegularPrinting } from "../game/compare";
import type { ModeSession } from "../stores/fabble";
import type { FabbleCard, PersistedStreaks } from "../types";
import { Countdown } from "./Countdown";
import { ShareBlock } from "./ShareBlock";

interface EndPanelProps {
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
		<div className="fabble-fade-in flex w-full max-w-140 flex-col items-center gap-5">
			<h2
				className={`text-2xl font-bold ${won ? "text-fabble-victory" : "text-fabble-defeat"}`}
			>
				{won ? t("end.victory") : t("end.defeat")}
			</h2>

			<div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-center">
				<img
					src={answer.imageUrl}
					alt={answer.name}
					crossOrigin="anonymous"
					className={`w-50 rounded-lg ${won ? "fabble-glow-victory" : "fabble-glow-defeat"}`}
				/>
				<div className="flex flex-col items-center gap-1 sm:items-start">
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

			<span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-white">
				{t(`play.mode_badge_${mode}`)}
			</span>

			<p className="text-body">
				{won
					? t("end.solved_in", { count: session.guesses.length })
					: t("end.defeat_reveal", { name: answer.name })}
			</p>

			<div className="flex gap-8">
				<div className="flex flex-col items-center">
					<span className="text-2xl font-bold text-heading">
						{streaks.current}
					</span>
					<span className="text-xs text-muted">{t("end.streak_current")}</span>
				</div>
				<div className="flex flex-col items-center">
					<span className="text-2xl font-bold text-heading">
						{streaks.best}
					</span>
					<span className="text-xs text-muted">{t("end.streak_best")}</span>
				</div>
			</div>

			<ShareBlock mode={mode} session={session} today={today} />

			<Countdown onNewDay={onNewDay} />
		</div>
	);
}
