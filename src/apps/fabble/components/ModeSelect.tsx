import { RulesDialog } from "@fabkit/apps/fabble/components/RulesDialog";
import { MODES } from "@fabkit/apps/fabble/config";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabble";
import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ModeSelect() {
	const { t } = useTranslation("fabble");
	const hasSeenRules = useFabbleStore((s) => s.hasSeenRules);
	const markRulesSeen = useFabbleStore((s) => s.markRulesSeen);
	const [rulesOpen, setRulesOpen] = useState(false);

	useEffect(() => {
		if (!hasSeenRules) setRulesOpen(true);
	}, [hasSeenRules]);

	function closeRules() {
		setRulesOpen(false);
		markRulesSeen();
	}

	return (
		<div className="flex w-full flex-col items-center gap-6">
			<p className="text-muted">{t("home.tagline")}</p>
			<button
				type="button"
				onClick={() => setRulesOpen(true)}
				className="flex items-center gap-1.5 rounded-full border border-border-primary px-4 py-1.5 text-sm text-body transition-colors hover:bg-surface-active"
			>
				<HelpCircle className="h-4 w-4" />
				{t("home.how_to_play")}
			</button>
			<div className="flex w-full max-w-160 flex-col gap-6 sm:flex-row sm:justify-center">
				{MODES.map((mode) => (
					<div
						key={mode}
						className="flex w-full flex-col gap-3 rounded-lg border border-border-primary bg-surface p-5 sm:w-70"
					>
						<h2 className="text-lg font-bold text-heading">
							{t(`home.modes.${mode}.name`)}
						</h2>
						<p className="text-sm text-muted">
							{t(`home.modes.${mode}.blurb`)}
						</p>
						<div className="mt-auto flex items-end justify-between">
							<p className="text-xs text-muted">
								{t(`home.modes.${mode}.meta`)}
							</p>
							<Link
								to={mode === "standard" ? "/fabble/standard" : "/fabble/chaos"}
								className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
							>
								{t("home.modes.play")}
							</Link>
						</div>
					</div>
				))}
			</div>
			<RulesDialog open={rulesOpen} onClose={closeRules} />
		</div>
	);
}
