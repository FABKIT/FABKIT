import { Link } from "@tanstack/react-router";
import { ArrowLeft, HelpCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Rotation } from "../../lib/rotations";
import type { FabbleMode } from "../../lib/types";

interface PuzzleToolbarProps {
	mode: FabbleMode;
	guessCount: number;
	guessLimit: number;
	onOpenRules: () => void;
	onReset: () => void;
	activeRotation?: Rotation | null;
}

export function PuzzleToolbar({
	mode,
	guessCount,
	guessLimit,
	onOpenRules,
	onReset,
	activeRotation,
}: PuzzleToolbarProps) {
	const { t } = useTranslation("fabble");

	const modeLabelKey =
		mode === "standard"
			? "puzzle.mode_label_standard"
			: "puzzle.mode_label_chaos";

	return (
		<div className="flex items-center justify-between w-full max-w-2xl mx-auto px-4 py-3">
			<div className="flex items-center gap-3">
				<Link
					to="/fabble"
					className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold text-muted hover:text-heading hover:border-border-primary transition-colors min-h-[44px]"
					aria-label={t("aria.back_to_mode_select")}
				>
					<ArrowLeft className="size-4" />
					<span>{t("action.back_to_menu")}</span>
				</Link>
				<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-white">
					{t(modeLabelKey)}
				</span>
				{activeRotation && (
					<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface border border-border-primary text-heading">
						<Sparkles className="size-3 shrink-0" />
						{t(activeRotation.labelKey)}
					</span>
				)}
				<span className="text-sm text-muted">
					{t("puzzle.guess_counter", {
						current: guessCount,
						limit: guessLimit,
					})}
				</span>
			</div>
			<div className="flex items-center gap-2">
				{import.meta.env.DEV && (
					<button
						type="button"
						onClick={onReset}
						className="text-[11px] text-faint hover:text-subtle transition-colors px-2 py-1"
					>
						{t("action.reset_session")}
					</button>
				)}
				<button
					type="button"
					onClick={onOpenRules}
					aria-label={t("aria.open_rules")}
					className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-heading transition-colors"
				>
					<HelpCircle className="size-5" />
				</button>
			</div>
		</div>
	);
}


