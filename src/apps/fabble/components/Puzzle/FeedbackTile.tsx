import { formatPitchValue } from "@fabkit/apps/fabble/lib/displayValues";
import { NOTCLASSED_LABEL_KEY } from "@fabkit/apps/fabble/lib/feedback";
import type {
	ColumnId,
	FeedbackCell,
	MatchCell,
	NoMatchCell,
	SetComparison,
} from "@fabkit/apps/fabble/lib/types";
import { ArrowDown, ArrowUp, Ban, Check, X } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface FeedbackTileProps {
	cell: FeedbackCell;
	column: ColumnId;
	columnLabel: string;
	guessValue?: string;
	animate?: boolean;
	animationDelay?: number;
	isWinningRow?: boolean;
}

function getTileClasses(cell: FeedbackCell, isWinningRow?: boolean): string {
	if (isWinningRow) {
		return "fabble-tile-match text-fabble-match-text border-2 border-fabble-match";
	}
	switch (cell.state) {
		case "match":
			return "fabble-tile-match text-fabble-match-text border-2 border-fabble-match";
		case "partial":
			return "fabble-tile-partial text-fabble-partial-text border-2 border-fabble-partial";
		case "no-match":
			return "fabble-tile-no-match text-fabble-no-match-text border-2 border-fabble-no-match";
		case "na":
			return "fabble-tile-match text-fabble-match-text border-2 border-dashed border-fabble-match";
		default:
			return "";
	}
}

function SetComparisonList({ comparisons }: { comparisons: SetComparison[] }) {
	const sizeClass =
		comparisons.length >= 6
			? "fabble-set-tighter"
			: comparisons.length >= 4
				? "fabble-set-tight"
				: "text-xs";
	return (
		<div className={`flex flex-col gap-px w-full ${sizeClass}`}>
			{comparisons.map((c) => (
				<span
					key={c.name}
					className="font-semibold leading-tight w-full text-left flex items-center gap-0.5"
				>
					<span className="flex-1">{c.name}</span>
					{c.state === "match" ? (
						<Check className="size-2.5 shrink-0" />
					) : c.state === "higher" ? (
						<ArrowUp className="size-2.5 shrink-0" />
					) : (
						<ArrowDown className="size-2.5 shrink-0" />
					)}
				</span>
			))}
		</div>
	);
}

function buildTileContent(
	cell: FeedbackCell,
	columnId: ColumnId,
	resolvedGuessValue: string | undefined,
	t: (key: string, options?: Record<string, unknown>) => string,
	setComparisons: SetComparison[] | undefined,
	isRainbowMatch: boolean,
): ReactNode {
	if (columnId === "set" && setComparisons && setComparisons.length > 0) {
		return <SetComparisonList comparisons={setComparisons} />;
	}

	if (cell.state === "match") {
		if (isRainbowMatch) {
			return (
				<span className="text-xs font-bold leading-tight w-full text-left break-words">
					{t("tile.rainbow_all_colors")}
				</span>
			);
		}
		const rawVal =
			columnId === "pitch" ? formatPitchValue(cell.value) : `${cell.value}`;
		const displayVal =
			rawVal === NOTCLASSED_LABEL_KEY ? t(NOTCLASSED_LABEL_KEY) : rawVal;
		return (
			<span className="text-xs font-bold leading-tight w-full text-left break-words">
				{displayVal}
			</span>
		);
	}

	if (cell.state === "partial") {
		const displayVal = cell.overlapping?.join(", ") ?? cell.guessValue;
		return (
			<span className="text-xs font-bold leading-tight w-full text-left break-words">
				{displayVal}
			</span>
		);
	}

	if (cell.state === "no-match") {
		if (cell.naDaily) {
			return (
				<span className="text-xs font-bold leading-tight w-full text-left flex items-center gap-1">
					<span className="break-words">{resolvedGuessValue}</span>
					<Ban className="size-3 shrink-0" aria-hidden="true" />
				</span>
			);
		}

		const displayVal =
			columnId === "pitch" || cell.direction !== undefined
				? resolvedGuessValue
				: cell.revealedDailyValue !== undefined
					? `${cell.revealedDailyValue}`
					: resolvedGuessValue;

		if (displayVal && cell.direction) {
			return (
				<span className="text-xs font-bold leading-tight w-full text-left flex items-center gap-1">
					<span className="break-words">{displayVal}</span>
					{cell.direction === "higher" ? (
						<ArrowUp className="size-3 shrink-0" />
					) : (
						<ArrowDown className="size-3 shrink-0" />
					)}
				</span>
			);
		}
		if (displayVal) {
			return (
				<span className="text-xs font-bold leading-tight w-full text-left break-words">
					{displayVal}
				</span>
			);
		}
		return <X className="size-4" />;
	}

	if (cell.state === "na") {
		if (resolvedGuessValue && resolvedGuessValue !== "—") {
			return (
				<span className="text-xs font-bold leading-tight w-full text-left flex items-center gap-1">
					<span className="break-words">{resolvedGuessValue}</span>
					<Ban className="size-3 shrink-0" aria-hidden="true" />
				</span>
			);
		}
		return <Ban className="size-3 shrink-0" aria-hidden="true" />;
	}

	return null;
}

export function FeedbackTile({
	cell,
	column: columnId,
	columnLabel,
	guessValue,
	animate = false,
	animationDelay = 0,
	isWinningRow = false,
}: FeedbackTileProps) {
	const { t } = useTranslation("fabble");

	const tileClasses = getTileClasses(cell, isWinningRow);
	const animClass = animate ? "fabble-tile--reveal" : "";

	const isRainbowMatch =
		cell.state === "match" && (cell as MatchCell).rainbowHint === true;

	const setComparisons =
		columnId === "set" && (cell.state === "match" || cell.state === "no-match")
			? (cell as MatchCell | NoMatchCell).setComparisons
			: undefined;

	// Build aria-label
	let ariaLabel = "";
	if (cell.state === "match") {
		if (isRainbowMatch) {
			ariaLabel = t("aria.pitch_rainbow");
		} else if (columnId === "pitch" && cell.value === "—") {
			ariaLabel = t("aria.pitch_match_no_pitch");
		} else {
			ariaLabel = t("aria.match", {
				column: columnLabel,
				value: cell.value,
			});
		}
	} else if (cell.state === "partial") {
		ariaLabel = t("aria.partial", {
			column: columnLabel,
			guessValue: cell.guessValue,
			overlapping: cell.overlapping?.join(", ") ?? cell.guessValue,
		});
	} else if (cell.state === "no-match") {
		if (columnId === "pitch" && cell.revealedDailyValue !== undefined) {
			ariaLabel = t("aria.pitch_no_match", {
				value: guessValue,
				revealedValue: cell.revealedDailyValue,
			});
		} else if (cell.direction === "higher") {
			ariaLabel = t("aria.no_match_higher", {
				column: columnLabel,
				value: cell.revealedDailyValue ?? "",
			});
		} else if (cell.direction === "lower") {
			ariaLabel = t("aria.no_match_lower", {
				column: columnLabel,
				value: cell.revealedDailyValue ?? "",
			});
		} else {
			ariaLabel = t("aria.no_match", { column: columnLabel, value: "" });
		}
	} else if (cell.state === "na") {
		ariaLabel = t("aria.na", { column: columnLabel });
	}

	// Translate i18n sentinel values that come through the pure-function pipeline
	const resolvedGuessValue =
		guessValue === NOTCLASSED_LABEL_KEY ? t(NOTCLASSED_LABEL_KEY) : guessValue;

	const tileContent = useMemo(
		() =>
			buildTileContent(
				cell,
				columnId,
				resolvedGuessValue,
				t,
				setComparisons,
				isRainbowMatch,
			),
		[cell, columnId, resolvedGuessValue, t, setComparisons, isRainbowMatch],
	);

	return (
		<div
			role="img"
			className={[
				tileClasses,
				animClass,
				"h-28 w-full p-2 rounded-md font-semibold flex flex-col items-start justify-between gap-1 overflow-hidden",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label={ariaLabel}
			style={
				animate && animationDelay > 0
					? { animationDelay: `${animationDelay}ms` }
					: undefined
			}
		>
			<span className="text-xs font-semibold uppercase tracking-wide opacity-75 leading-none w-full text-left">
				{columnLabel}
			</span>
			<div className="flex flex-col items-start justify-center flex-1 w-full">
				{tileContent}
			</div>
		</div>
	);
}
