import { ArrowDown, ArrowUp, Ban, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPitchValue } from "../../lib/displayValues";
import type {
	ColumnId,
	FeedbackCell,
	MatchCell,
	NoMatchCell,
	SetComparison,
} from "../../lib/types";

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
	}
}

function SetComparisonList({ comparisons }: { comparisons: SetComparison[] }) {
	return (
		<div className="flex flex-col gap-0.5 w-full">
			{comparisons.map((c) => (
				<span
					key={c.name}
					className="text-[9px] font-semibold leading-tight w-full text-left flex items-center gap-0.5"
				>
					<span className="break-words flex-1">{c.name}</span>
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

export function FeedbackTile({
	cell,
	column: _column,
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
		_column === "set" && (cell.state === "match" || cell.state === "no-match")
			? (cell as MatchCell | NoMatchCell).setComparisons
			: undefined;

	// Build aria-label
	let ariaLabel = "";
	if (cell.state === "match") {
		if (isRainbowMatch) {
			ariaLabel = t("aria.pitch_rainbow");
		} else if (_column === "pitch" && cell.value === "—") {
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
		if (_column === "pitch" && cell.revealedDailyValue !== undefined) {
			ariaLabel = t("aria.pitch_no_match", {
				value: cell.revealedDailyValue,
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

	function renderValue() {
		// Set column: always show full list of sets with direction indicators
		if (_column === "set" && setComparisons && setComparisons.length > 0) {
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
			const displayVal =
				_column === "pitch" ? formatPitchValue(cell.value) : String(cell.value);
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
			// Daily has no such stat — show guessed value + ban icon so player knows
			// to look for a card that also lacks this attribute entirely.
			if (cell.naDaily) {
				return (
					<span className="text-xs font-bold leading-tight w-full text-left flex items-center gap-1">
						<span className="break-words">{guessValue}</span>
						<Ban className="size-3 shrink-0" aria-hidden="true" />
					</span>
				);
			}

			// Show the guessed card's value alongside the direction arrow.
			// The arrow already tells the player whether the answer is higher or lower.
			// For non-directional categoricals, fall through to show nothing (X icon).
			const displayVal =
				_column === "pitch" || cell.direction !== undefined
					? guessValue
					: cell.revealedDailyValue !== undefined
						? String(cell.revealedDailyValue)
						: guessValue;

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
			if (guessValue && guessValue !== "—") {
				return (
					<span className="text-xs font-bold leading-tight w-full text-left flex items-center gap-1">
						<span className="break-words">{guessValue}</span>
						<Ban className="size-3 shrink-0" aria-hidden="true" />
					</span>
				);
			}
			return <Ban className="size-3 shrink-0" aria-hidden="true" />;
		}

		return null;
	}

	return (
		<div
			role="img"
			className={[
				tileClasses,
				animClass,
				"min-h-[80px] w-full p-2 rounded-md font-semibold flex flex-col items-start justify-between gap-1",
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
			<span className="text-[9px] font-semibold uppercase tracking-wide opacity-75 leading-none w-full text-left">
				{columnLabel}
			</span>
			<div className="flex flex-col items-start justify-center flex-1 w-full">
				{renderValue()}
			</div>
		</div>
	);
}


