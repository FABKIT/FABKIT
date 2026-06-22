import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FAB_CDN_BASE } from "@fabkit/apps/fabble/lib/constants";
import { getCardColumnValues } from "@fabkit/apps/fabble/lib/displayValues";
import type {
	CanonicalCard,
	ColumnId,
	GuessEntry,
	MatchCell,
} from "@fabkit/apps/fabble/lib/types";
import { FeedbackTile } from "./FeedbackTile";

interface GuessCardProps {
	row: GuessEntry;
	animate: boolean;
	imageKey: string | undefined;
	card: CanonicalCard | undefined;
	isAnswer: boolean;
}

const COLUMN_I18N_KEYS: Record<ColumnId, string> = {
	type: "column.type",
	class: "column.class",
	talent: "column.talent",
	pitch: "column.pitch",
	cost: "column.cost",
	power: "column.power",
	defense: "column.defense",
	lifeOrIntellect: "column.life_intellect",
	subtype: "column.subtype",
	keyword: "column.keyword",
	set: "column.set",
};


export function GuessCard({
	row,
	animate,
	imageKey,
	card,
	isAnswer,
}: GuessCardProps) {
	const { t } = useTranslation("fabble");
	const [imgFailed, setImgFailed] = useState(false);

	const guessValues = card ? getCardColumnValues(card) : undefined;

	const typeCell = row.feedbackRow.type;
	const typeLabel =
		typeCell.state === "match" ? `${(typeCell as MatchCell).value}` : null;

	return (
		<div
			className={[
				"w-full rounded-lg bg-surface-muted border border-border flex flex-col gap-2 p-3",
				animate ? "fabble-card--enter" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			{/* Zone A: card identity header */}
			<div className="flex flex-row items-center gap-3">
				{imageKey && !imgFailed ? (
					<img
						src={`${FAB_CDN_BASE}${imageKey}.webp`}
						alt={row.name}
						className={[
							"rounded object-cover bg-surface-muted shrink-0 w-20 h-28",
							isAnswer ? "" : "grayscale brightness-75",
						].filter(Boolean).join(" ")}
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div
						className="rounded bg-surface-muted shrink-0 flex items-center justify-center w-20 h-28"
						aria-hidden="true"
					>
						<span className="text-xs text-muted font-bold">
							{row.name.slice(0, 2).toUpperCase()}
						</span>
					</div>
				)}
				<div className="flex flex-col gap-0.5 min-w-0">
					<div className="flex items-center gap-1.5">
						<span className="text-base font-bold text-heading leading-tight">
							{row.name}
						</span>
						{!isAnswer && (
							<span
								className="inline-flex items-center justify-center size-5 rounded-full bg-fabble-no-match shrink-0"
								aria-hidden="true"
							>
								<X className="size-3 text-fabble-no-match-text" />
							</span>
						)}
					</div>
					{typeLabel && (
						<span className="text-xs text-muted leading-tight">
							{typeLabel}
						</span>
					)}
				</div>
			</div>

			{/* Zone B: tile grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
				{(Object.keys(COLUMN_I18N_KEYS) as ColumnId[]).map((column, colIndex) => {
					const cell = row.feedbackRow[column];
					return (
						<FeedbackTile
							key={column}
							cell={cell}
							column={column}
							columnLabel={t(COLUMN_I18N_KEYS[column])}
							guessValue={guessValues?.[column]}
							animate={animate}
							animationDelay={animate ? colIndex * 100 : 0}
							isWinningRow={isAnswer}
						/>
					);
				})}
			</div>
		</div>
	);
}
