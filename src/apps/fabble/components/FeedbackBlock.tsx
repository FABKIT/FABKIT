import { FeedbackTile } from "@fabkit/apps/fabble/components/FeedbackTile";
import { TwinToast } from "@fabkit/apps/fabble/components/TwinToast";
import { REVEAL_TOTAL_MS, TILE_STAGGER_MS } from "@fabkit/apps/fabble/config";
import type { FabbleCard, GuessResult } from "@fabkit/apps/fabble/types";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface FeedbackBlockProps {
	result: GuessResult;
	card: FabbleCard;
	alreadyAnimated: boolean;
	/** Must be referentially stable (e.g. a store action) so the reveal timer
	 * below isn't reset by parent re-renders mid-animation. */
	onAnimated: (guessId: string) => void;
}

export function FeedbackBlock({
	result,
	card,
	alreadyAnimated,
	onAnimated,
}: FeedbackBlockProps) {
	const { t } = useTranslation("fabble");
	const guessId = result.guessId;

	useEffect(() => {
		if (alreadyAnimated) return;
		// Deferred until the flip sequence actually finishes — calling this
		// synchronously on mount re-renders with alreadyAnimated=true almost
		// immediately, stripping the flip class before the tiles ever animate.
		const timer = setTimeout(() => onAnimated(guessId), REVEAL_TOTAL_MS);
		return () => clearTimeout(timer);
	}, [alreadyAnimated, onAnimated, guessId]);

	return (
		<div className="w-full max-w-180 rounded-lg border border-border-primary bg-surface p-4">
			<div className="mb-3 flex items-center gap-3">
				<img
					src={card.thumbnailUrl}
					alt=""
					loading="lazy"
					crossOrigin="anonymous"
					className={`h-16 w-11 rounded-sm object-cover ${result.correct ? "" : "grayscale"}`}
				/>
				<div>
					<div className="flex items-center gap-1.5">
						<span className="font-bold text-heading">{card.name}</span>
						{!result.correct && !result.isTwin && (
							<X className="h-4 w-4 rounded-full bg-feedback-miss text-feedback-on-tile-inverted" />
						)}
						{result.isTwin && (
							<span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-heading">
								{t("feedback.twin_badge")}
							</span>
						)}
					</div>
					<span className="text-xs text-muted">{t(`types.${card.type}`)}</span>
				</div>
			</div>
			<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
				{result.columns.map((feedback, i) => (
					<FeedbackTile
						key={feedback.column}
						feedback={feedback}
						flip={!alreadyAnimated}
						style={
							alreadyAnimated
								? undefined
								: { animationDelay: `${i * TILE_STAGGER_MS}ms` }
						}
					/>
				))}
			</div>
			{result.isTwin && <TwinToast />}
		</div>
	);
}
