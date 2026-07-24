import type { AnyFabbleMode } from "@fabkit/apps/fabble/config";
import { ALL_MODES, MODE_ROUTES } from "@fabkit/apps/fabble/config";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export interface ModeSwitchButtonsProps {
	currentMode: AnyFabbleMode;
}

/** Shown on every end-of-puzzle panel — links to the two modes NOT currently being played. */
export function ModeSwitchButtons({ currentMode }: ModeSwitchButtonsProps) {
	const { t } = useTranslation("fabble");
	const otherModes = ALL_MODES.filter((mode) => mode !== currentMode);

	return (
		<div className="flex flex-wrap justify-center gap-2">
			{otherModes.map((mode) => (
				<Link
					key={mode}
					to={MODE_ROUTES[mode]}
					className="rounded-md border border-border-primary px-3 py-1.5 text-xs font-semibold text-body transition-colors hover:bg-surface-active"
				>
					{t("end.play_mode_button", { mode: t(`home.modes.${mode}.name`) })}
				</Link>
			))}
		</div>
	);
}
