import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface EndlessStatusBarProps {
	guessCount: number;
	isPlaying: boolean;
	onGiveUp: () => void;
	onHelp: () => void;
}

export function EndlessStatusBar({
	guessCount,
	isPlaying,
	onGiveUp,
	onHelp,
}: EndlessStatusBarProps) {
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
					{t("play.mode_badge_endless")}
				</span>
				<span className="text-sm text-body">
					{t("play.endless_guess_count", { count: guessCount })}
				</span>
			</div>
			<div className="flex items-center gap-3">
				{isPlaying && (
					<button
						type="button"
						onClick={onGiveUp}
						className="text-sm text-muted underline-offset-2 transition-colors hover:text-body hover:underline"
					>
						{t("play.give_up")}
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
