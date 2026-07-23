import { HINT_UNLOCK_GUESSES } from "@fabkit/apps/fabble/config";
import { earliestRegularPrinting } from "@fabkit/apps/fabble/game/compare";
import type { FabbleCard } from "@fabkit/apps/fabble/types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { Lock, LockOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface HintsRowProps {
	answer: FabbleCard;
	guessCount: number;
	hintsRevealed: [boolean, boolean];
	onReveal: (hintIndex: 0 | 1) => void;
}

export function HintsRow({
	answer,
	guessCount,
	hintsRevealed,
	onReveal,
}: HintsRowProps) {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex w-full max-w-160 flex-wrap items-center gap-2">
			<span className="text-[11px] font-medium tracking-wide text-muted uppercase">
				{t("hints.title")}
			</span>
			<div className="flex flex-nowrap gap-1.5">
				<HintPill
					label={t("hints.rarity_label")}
					unlockAt={HINT_UNLOCK_GUESSES[0]}
					guessCount={guessCount}
					revealed={hintsRevealed[0]}
					onReveal={() => onReveal(0)}
				>
					<img
						src={CardRarities[answer.rarity].icon}
						alt=""
						className="h-4 w-4"
					/>
					{t(`rarity.${answer.rarity}`)}
				</HintPill>
				<HintPill
					label={t("hints.set_label")}
					unlockAt={HINT_UNLOCK_GUESSES[1]}
					guessCount={guessCount}
					revealed={hintsRevealed[1]}
					onReveal={() => onReveal(1)}
				>
					{earliestRegularPrinting(answer).name}
				</HintPill>
			</div>
		</div>
	);
}

export interface HintPillProps {
	label: string;
	unlockAt: number;
	guessCount: number;
	revealed: boolean;
	onReveal: () => void;
	children: ReactNode;
}

function HintPill({
	label,
	unlockAt,
	guessCount,
	revealed,
	onReveal,
	children,
}: HintPillProps) {
	const { t } = useTranslation("fabble");

	if (revealed) {
		return (
			<span className="flex items-center gap-1.5 rounded-full border border-primary bg-surface-active px-2.5 py-1 text-xs text-body">
				{children}
			</span>
		);
	}

	if (guessCount >= unlockAt) {
		return (
			<button
				type="button"
				onClick={onReveal}
				className="flex items-center gap-1.5 rounded-full border border-primary px-2.5 py-1 text-xs text-heading transition-colors hover:bg-surface-active"
			>
				<LockOpen className="h-3 w-3" />
				{label}
			</button>
		);
	}

	return (
		<span className="flex items-center gap-1.5 rounded-full border border-border-primary px-2.5 py-1 text-xs text-muted">
			<Lock className="h-3 w-3" />
			{t("hints.locked", { count: unlockAt })}
		</span>
	);
}
