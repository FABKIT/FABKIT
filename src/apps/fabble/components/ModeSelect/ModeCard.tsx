import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HINT_UNLOCK_THRESHOLDS } from "../../lib/constants";

interface ModeCardProps {
	mode: "standard" | "chaos";
	guessLimit: number;
}

export function ModeCard({ mode, guessLimit }: ModeCardProps) {
	const { t } = useTranslation("fabble");

	const titleKey =
		mode === "standard" ? "mode.standard" : "mode.chaos";
	const descKey =
		mode === "standard"
			? "mode.standard_description"
			: "mode.chaos_description";
	const modeLabelKey =
		mode === "standard"
			? "puzzle.mode_label_standard"
			: "puzzle.mode_label_chaos";

	return (
		<div className="flex flex-col gap-4 p-6 rounded-xl border border-border-primary bg-surface shadow-sm hover:shadow-md transition-shadow">
			<div className="flex flex-col gap-1">
				<h2 className="text-xl font-bold text-heading">{t(titleKey)}</h2>
				<p className="text-sm text-muted">{t(descKey)}</p>
			</div>
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-0.5">
					<span className="text-sm text-subtle">
						{t("mode.guess_limit", { count: guessLimit })}
					</span>
					<span className="text-xs text-faint">
						{mode === "standard"
							? t("mode.hints_available", { count: HINT_UNLOCK_THRESHOLDS.length })
							: t("mode.no_hints")}
					</span>
				</div>
				<Link
					to="/fabble/$mode"
					params={{ mode }}
					className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
					aria-label={`${t("action.play")} ${t(modeLabelKey)}`}
				>
					{t("action.play")}
				</Link>
			</div>
		</div>
	);
}


