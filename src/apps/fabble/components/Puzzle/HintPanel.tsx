import { Eye, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HINT_UNLOCK_THRESHOLDS } from "../../lib/constants";
import type { Hint } from "../../lib/hints";

interface HintPanelProps {
	hints: Hint[];
	availableHintCount: number;
	revealedHintCount: number;
	onReveal: () => void;
}

export function HintPanel({
	hints,
	availableHintCount,
	revealedHintCount,
	onReveal,
}: HintPanelProps) {
	const { t } = useTranslation("fabble");

	return (
		<section
			aria-label={t("hint.section_label")}
			className="w-full max-w-2xl mx-auto px-4 py-2"
		>
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-[10px] font-semibold text-subtle uppercase tracking-wide shrink-0">
					{t("hint.section_label")}
				</span>

				{hints.map((hint, i) => {
					const isRevealed = i < revealedHintCount;
					const isAvailable = i < availableHintCount;
					const unlockAt = HINT_UNLOCK_THRESHOLDS[i];

					if (isRevealed) {
						return (
							<span
								key={hint.id}
								className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-active border border-border-primary text-heading"
							>
								<span className="sr-only">
									{t("hint.aria.revealed", {
										label: t(hint.labelKey),
										value: hint.value,
									})}
								</span>
								<span aria-hidden="true" className="text-muted">
									{t(hint.labelKey)}:
								</span>
								<span aria-hidden="true">{hint.value}</span>
							</span>
						);
					}

					if (isAvailable) {
						return (
							<button
								key={hint.id}
								type="button"
								onClick={onReveal}
								aria-label={t("hint.aria.reveal", {
									label: t(hint.labelKey),
								})}
								className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-white hover:opacity-90 transition-opacity min-h-[32px]"
							>
								<Eye className="size-3 shrink-0" />
								{t("hint.reveal", { label: t(hint.labelKey) })}
							</button>
						);
					}

					return (
						<span
							key={hint.id}
							title={t("hint.aria.locked", { count: unlockAt })}
							className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-faint bg-surface-muted border border-border"
						>
							<Lock className="size-3 shrink-0" />
							{t("hint.locked", { count: unlockAt })}
						</span>
					);
				})}
			</div>
		</section>
	);
}


