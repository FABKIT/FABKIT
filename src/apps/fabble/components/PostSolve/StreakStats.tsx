import { useTranslation } from "react-i18next";
import type { StreakData } from "../../lib/types";

interface StreakStatsProps {
	streak: StreakData;
}

export function StreakStats({ streak }: StreakStatsProps) {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex gap-6 justify-center">
			<div className="flex flex-col items-center">
				<span className="text-2xl font-bold text-heading">
					{streak.current}
				</span>
				<span className="text-xs text-muted">
					{t("result.streak_current", { count: streak.current })}
				</span>
			</div>
			<div className="flex flex-col items-center">
				<span className="text-2xl font-bold text-heading">{streak.max}</span>
				<span className="text-xs text-muted">
					{t("result.streak_max", { count: streak.max })}
				</span>
			</div>
		</div>
	);
}


