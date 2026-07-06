import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FabbleMode } from "../config";

interface StatusBarProps {
	mode: FabbleMode;
	guessCount: number;
	maxGuesses: number;
}

export function StatusBar({ mode, guessCount, maxGuesses }: StatusBarProps) {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex w-full max-w-160 flex-wrap items-center justify-between gap-2">
			<div className="flex items-center gap-2">
				<Link
					to="/fabble"
					className="rounded-full border border-border-primary px-3 py-1 text-sm text-muted transition-colors hover:text-body"
				>
					{t("play.menu_back")}
				</Link>
				<span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-white">
					{t(`play.mode_badge_${mode}`)}
				</span>
				<span className="text-sm text-body">
					{t("play.guess_counter", { current: guessCount, max: maxGuesses })}
				</span>
			</div>
			<button
				type="button"
				aria-label={t("common.help")}
				className="text-muted transition-colors hover:text-body"
			>
				<HelpCircle className="h-5 w-5" />
			</button>
		</div>
	);
}
