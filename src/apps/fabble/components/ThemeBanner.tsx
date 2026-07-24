import type { DailyPuzzle } from "@fabkit/apps/fabble/game/daily";
import { Swords, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ThemeBannerProps {
	theme: DailyPuzzle["theme"];
	onDismiss: () => void;
}

export function ThemeBanner({ theme, onDismiss }: ThemeBannerProps) {
	const { t } = useTranslation("fabble");

	if (!theme) return null;

	return (
		<div className="flex w-full max-w-160 items-center gap-2 rounded-md border-l-4 border-primary bg-surface-active px-3 py-2 text-sm text-heading">
			<Swords className="h-4 w-4 shrink-0" />
			<span className="flex-1">
				{theme.kind === "equipment"
					? t("play.theme.equipment_monday")
					: t("play.theme.class_thursday", { className: theme.className })}
			</span>
			<button
				type="button"
				onClick={onDismiss}
				aria-label={t("play.theme.dismiss")}
				className="shrink-0 rounded-full p-1 text-heading transition-colors hover:bg-surface"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}
