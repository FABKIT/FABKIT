import { RulesDialog } from "@fabkit/apps/fabble/components/RulesDialog";
import {
	ALL_MODES,
	type AnyFabbleMode,
	MODE_ROUTES,
} from "@fabkit/apps/fabble/config";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabble";
import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const MODE_IMAGES: Record<AnyFabbleMode, string> = {
	standard: "/img/fabble/standardmode.webp",
	chaos: "/img/fabble/chaosmode.webp",
	endless: "/img/fabble/endlessmode.webp",
};

export function ModeSelect() {
	const { t } = useTranslation("fabble");
	const hasSeenRules = useFabbleStore((s) => s.hasSeenRules);
	const markRulesSeen = useFabbleStore((s) => s.markRulesSeen);
	const [rulesOpen, setRulesOpen] = useState(false);

	useEffect(() => {
		if (!hasSeenRules) setRulesOpen(true);
	}, [hasSeenRules]);

	const closeRules = useCallback(() => {
		setRulesOpen(false);
		markRulesSeen();
	}, [markRulesSeen]);

	return (
		<div className="flex w-full flex-col items-center gap-6">
			<p className="text-muted">{t("home.tagline")}</p>
			<button
				type="button"
				onClick={() => setRulesOpen(true)}
				className="flex items-center gap-1.5 rounded-md border border-border-primary px-4 py-1.5 text-sm text-body transition-colors hover:bg-surface-active"
			>
				<HelpCircle className="h-4 w-4" />
				{t("home.how_to_play")}
			</button>
			<div className="flex w-full max-w-240 flex-col gap-6 sm:flex-row sm:flex-wrap sm:justify-center">
				{ALL_MODES.map((mode) => (
					<div
						key={mode}
						className="relative flex w-full flex-col gap-3 overflow-hidden rounded-lg border border-border-primary p-5 sm:w-70"
					>
						<img
							src={MODE_IMAGES[mode]}
							alt=""
							className="absolute inset-0 h-full w-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/35" />
						<h2 className="relative text-lg font-bold text-on-image">
							{t(`home.modes.${mode}.name`)}
						</h2>
						<p className="relative text-sm text-on-image-muted">
							{t(`home.modes.${mode}.blurb`)}
						</p>
						<div className="relative mt-auto flex items-end justify-between">
							<p className="text-xs text-on-image-muted">
								{t(`home.modes.${mode}.meta`)}
							</p>
							<Link
								to={MODE_ROUTES[mode]}
								className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
