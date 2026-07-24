import { AnswerReveal } from "@fabkit/apps/fabble/components/AnswerReveal";
import { Countdown } from "@fabkit/apps/fabble/components/Countdown";
import { ModeSwitchButtons } from "@fabkit/apps/fabble/components/ModeSwitchButtons";
import { ShareBlock } from "@fabkit/apps/fabble/components/ShareBlock";
import type { FabbleMode } from "@fabkit/apps/fabble/config";
import type { ModeSession } from "@fabkit/apps/fabble/stores/fabble";
import type { FabbleCard, PersistedStreaks } from "@fabkit/apps/fabble/types";
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

	return (
		<div className="fabble-fade-in flex w-full max-w-180 flex-col items-center gap-3">
			<h2
				className={`fabble-heading-bounce mt-4 text-3xl font-extrabold uppercase tracking-wide ${won ? "text-fabble-victory" : "text-fabble-defeat"}`}
			>
				{won ? t("end.victory") : t("end.defeat")}
			</h2>

			<AnswerReveal
				answer={answer}
				won={won}
				sideContent={
					<>
						<span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white">
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
								<span className="text-xs text-muted">
									{t("end.streak_current")}
								</span>
							</div>
							<div className="flex flex-col items-center">
								<span className="text-xl font-bold text-heading">
									{streaks.best}
								</span>
								<span className="text-xs text-muted">
									{t("end.streak_best")}
								</span>
							</div>
						</div>

						<ShareBlock mode={mode} session={session} today={today} />
					</>
				}
				belowCardContent={
					<>
						<Countdown onNewDay={onNewDay} />
						<ModeSwitchButtons currentMode={mode} />
					</>
				}
			/>
		</div>
	);
}
