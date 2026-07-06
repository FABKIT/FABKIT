import { Swords } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DailyPuzzle } from "../game/daily";

interface ThemeBannerProps {
	theme: DailyPuzzle["theme"];
}

export function ThemeBanner({ theme }: ThemeBannerProps) {
	const { t } = useTranslation("fabble");

	if (!theme) return null;

	return (
		<div className="flex w-full max-w-160 items-center gap-2 rounded-md border-l-4 border-primary bg-surface-active px-3 py-2 text-sm text-heading">
			<Swords className="h-4 w-4 shrink-0" />
			<span>
				{theme.kind === "equipment"
					? t("play.theme.equipment_monday")
					: t("play.theme.class_thursday", { className: theme.className })}
			</span>
		</div>
	);
}
