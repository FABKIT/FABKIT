import type { FabbleMode } from "@fabkit/apps/fabble/config";
import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface StatusBarProps {
	mode: FabbleMode;
	guessCount: number;
	maxGuesses: number;
	onReset: () => void;
	onHelp: () => void;
}

export function StatusBar({
	mode,
	guessCount,
	maxGuesses,
	onReset,
	onHelp,
}: StatusBarProps) {
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
			<div className="flex items-center gap-3">
				{import.meta.env.DEV && (
					<button
						type="button"
						onClick={onReset}
						className="text-sm text-muted underline-offset-2 transition-colors hover:text-body hover:underline"
					>
						{t("play.dev_reset")}
					</button>
				)}
				<button
					type="button"
					onClick={onHelp}
					aria-label={t("common.help")}
					className="text-muted transition-colors hover:text-body"
				>
					<HelpCircle className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
}
