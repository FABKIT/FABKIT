import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TILE_FLIP_DURATION_MS } from "../../lib/constants";
import type { CanonicalCard, GuessEntry } from "../../lib/types";
import { GuessCard } from "./GuessCard";

interface GuessGridProps {
	rows: GuessEntry[];
	guessLimit: number;
	suppressGridAnimation: boolean;
	pool: CanonicalCard[];
	dailyName: string;
}

export function GuessGrid({
	rows,
	guessLimit,
	suppressGridAnimation,
	pool,
	dailyName,
}: GuessGridProps) {
	const { t } = useTranslation("fabble");
	const [liveText, setLiveText] = useState("");
	const prevRowCount = useRef(rows.length);

	// O(1) lookup instead of O(n) find per row per render
	const poolMap = useMemo(() => new Map(pool.map((c) => [c.name, c])), [pool]);

	useEffect(() => {
		if (rows.length > prevRowCount.current && !suppressGridAnimation) {
			const latestRow = rows[rows.length - 1];
			const feedback = latestRow.feedbackRow;
			const matchCount = Object.values(feedback).filter(
				(c) => c.state === "match",
			).length;
			const partialCount = Object.values(feedback).filter(
				(c) => c.state === "partial",
			).length;
			const timer = setTimeout(() => {
				setLiveText(
					t("aria.guess_result", {
						guessNumber: rows.length,
						guessName: latestRow.name,
						matchCount,
						partialCount,
						remaining: Math.max(0, guessLimit - rows.length),
					}),
				);
			}, TILE_FLIP_DURATION_MS);
			return () => clearTimeout(timer);
		}
		prevRowCount.current = rows.length;
	}, [rows, guessLimit, suppressGridAnimation, t]);

	// Reverse so newest guess shows at top; never mutate the original array
	const reversedRows = [...rows].reverse();

	return (
		<section
			className="flex flex-col gap-3 w-full"
			aria-label={t("aria.guess_grid")}
		>
			{reversedRows.map((row, idx) => {
				const originalIdx = rows.length - 1 - idx;
				const card = poolMap.get(row.name);
				const imageKey = card?.pitchVariants[0]?.defaultImage;
				return (
					<GuessCard
						key={`${row.name}-${originalIdx}`}
						row={row}
						animate={!suppressGridAnimation && originalIdx === rows.length - 1}
						imageKey={imageKey}
						card={card}
						isAnswer={row.name === dailyName}
					/>
				);
			})}
			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{liveText}
			</div>
		</section>
	);
}


