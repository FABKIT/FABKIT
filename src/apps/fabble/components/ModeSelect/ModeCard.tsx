import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HINT_UNLOCK_THRESHOLDS } from "@fabkit/apps/fabble/lib/constants";
import { FabbleModes, type FabbleMode } from "@fabkit/apps/fabble/lib/types";

interface ModeCardProps {
	mode: FabbleMode;
	guessLimit: number;
}

/** Returns all i18n keys for a given game mode: its title, description, and mode label. */
function getModeKeys(mode: FabbleMode): { titleKey: string; description: string; label: string } | null {
	switch (mode) {
		case "standard":
			return { titleKey: FabbleModes.standard, description: "mode.standard_description", label: "puzzle.mode_label_standard" };
		case "chaos":
			return { titleKey: FabbleModes.chaos, description: "mode.chaos_description", label: "puzzle.mode_label_chaos" };
		default:
			console.warn(`[getModeKeys] Unexpected mode: ${mode as string}`);
			return null;
	}
}

export function ModeCard({ mode, guessLimit }: ModeCardProps) {
	const { t } = useTranslation("fabble");

	const keys = getModeKeys(mode);
	if (!keys) return null;
	const { titleKey, description: descKey, label: modeLabelKey } = keys;

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
					className="inline-flex items-center justify-center min-h-11 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
					aria-label={`${t("action.play")} ${t(modeLabelKey)}`}
				>
					{t("action.play")}
				</Link>
			</div>
		</div>
	);
}


