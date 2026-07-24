import { AnswerReveal } from "@fabkit/apps/fabble/components/AnswerReveal";
import { ModeSwitchButtons } from "@fabkit/apps/fabble/components/ModeSwitchButtons";
import type { EndlessSession } from "@fabkit/apps/fabble/stores/fabble";
import type {
	FabbleCard,
	PersistedEndlessStreak,
} from "@fabkit/apps/fabble/types";
import { useTranslation } from "react-i18next";

export interface EndlessEndPanelProps {
	session: EndlessSession;
	answer: FabbleCard;
	streak: PersistedEndlessStreak;
	onNext: () => void;
}

export function EndlessEndPanel({
	session,
	answer,
	streak,
	onNext,
}: EndlessEndPanelProps) {
	const { t } = useTranslation("fabble");
	const won = session.status === "won";

	return (
		<div className="fabble-fade-in flex w-full max-w-180 flex-col items-center gap-3">
			<h2
				className={`fabble-heading-bounce mt-4 text-3xl font-extrabold uppercase tracking-wide ${won ? "text-fabble-victory" : "text-fabble-defeat"}`}
			>
				{won ? t("end.victory") : t("endless.gave_up")}
			</h2>

			<AnswerReveal
				answer={answer}
				won={won}
				bottomContent={
					<>
						<span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white">
							{t("play.mode_badge_endless")}
						</span>

						<p className="text-sm text-body">
							{won
								? t("end.solved_in", { count: session.guesses.length })
								: t("endless.gave_up_reveal", { name: answer.name })}
						</p>

						<div className="flex gap-6">
							<div className="flex flex-col items-center">
								<span className="text-xl font-bold text-heading">
									{streak.current}
								</span>
								<span className="text-xs text-muted">
									{t("end.streak_current")}
								</span>
							</div>
							<div className="flex flex-col items-center">
								<span className="text-xl font-bold text-heading">
									{streak.best}
								</span>
								<span className="text-xs text-muted">
									{t("end.streak_best")}
								</span>
							</div>
						</div>

						{streak.completedLog.length > 0 && (
							<div className="flex w-full max-w-80 flex-col gap-1">
								<span className="text-xs font-semibold text-muted uppercase tracking-wide">
									{t("endless.log_title")}
								</span>
								<ul className="flex flex-col gap-0.5 text-sm text-body">
									{streak.completedLog.map((entry, i) => (
										<li key={entry.answerId}>
											{t("endless.log_entry", {
												n: i + 1,
												count: entry.guessCount,
											})}
										</li>
									))}
								</ul>
							</div>
						)}

						<button
							type="button"
							onClick={onNext}
							className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						>
							{t("endless.next_puzzle")}
						</button>

						<ModeSwitchButtons currentMode="endless" />
					</>
				}
			/>
		</div>
	);
}
