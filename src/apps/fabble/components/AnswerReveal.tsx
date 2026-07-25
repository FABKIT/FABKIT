import { earliestRegularPrinting } from "@fabkit/apps/fabble/game/compare";
import type { FabbleCard } from "@fabkit/apps/fabble/types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface AnswerRevealProps {
	answer: FabbleCard;
	won: boolean;
	/** Right-column group below the name/rarity/set/artist block (mode badge, solved-in-X
	 * text, streaks, and for daily modes the share form). Bottom-aligned to the card image's
	 * bottom edge on desktop, with whitespace separating it from the details above; stacks
	 * in normal document flow on mobile. */
	sideContent: ReactNode;
	/** Stacked directly under the card image (countdown/next-puzzle button, then the
	 * mode-switch buttons) — desktop-only distinction from `sideContent`; on mobile both
	 * groups simply stack in document order. */
	belowCardContent: ReactNode;
}

/** Card image + name/rarity/set/artist block shown on every end-of-puzzle panel
 * (Standard/Chaos's EndPanel and Endless's EndlessEndPanel), so the set-priority
 * display logic (earliestRegularPrinting) stays in sync across both. */
export function AnswerReveal({
	answer,
	won,
	sideContent,
	belowCardContent,
}: AnswerRevealProps) {
	const { t } = useTranslation("fabble");
	const set = earliestRegularPrinting(answer);

	return (
		<div className="fabble-answer-grid mt-6 w-full">
			<div className="relative w-64 shrink-0 rounded-lg sm:w-80 [grid-area:image]">
				<img
					src={answer.imageUrl}
					alt={answer.name}
					crossOrigin="anonymous"
					className="fabble-card-reveal w-64 rounded-lg sm:w-80"
				/>
				<div
					className={`fabble-glow-layer ${won ? "fabble-glow-layer--victory" : "fabble-glow-layer--defeat"}`}
				/>
			</div>
			<div className="flex h-full flex-col items-center gap-6 [grid-area:side] sm:items-start sm:justify-between">
				<div className="fabble-card-reveal flex flex-col items-center gap-1 sm:items-start">
					<span className="text-2xl font-bold text-heading">{answer.name}</span>
					<span className="flex items-center gap-1.5 text-base text-body">
						<img
							src={CardRarities[answer.rarity].icon}
							alt=""
							className="h-5 w-5"
						/>
						{t(`rarity.${answer.rarity}`)}
					</span>
					<span className="text-base text-body">{set.name}</span>
					<span className="text-sm text-muted">
						{t("end.art_by", { artist: answer.artist })}
					</span>
				</div>
				<div className="flex flex-col items-center gap-3 sm:items-start">
					{sideContent}
				</div>
			</div>
			<div className="flex w-full flex-col items-center gap-3 [grid-area:below]">
				{belowCardContent}
			</div>
		</div>
	);
}
