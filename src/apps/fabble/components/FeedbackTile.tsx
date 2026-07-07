import type { ColumnFeedback } from "@fabkit/apps/fabble/types";
import { ArrowDown, ArrowUp, Ban, Check } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface FeedbackTileProps {
	feedback: ColumnFeedback;
	style?: CSSProperties;
	flip?: boolean;
}

const STATE_BG: Record<ColumnFeedback["state"], string> = {
	match: "bg-feedback-match",
	partial: "bg-feedback-partial",
	miss: "bg-feedback-miss",
};

const STATE_TEXT: Record<ColumnFeedback["state"], string> = {
	match: "text-feedback-on-tile",
	partial: "text-feedback-on-tile",
	miss: "text-feedback-on-tile-inverted",
};

const MAX_VISIBLE_SET_ENTRIES = 3;

export function FeedbackTile({ feedback, style, flip }: FeedbackTileProps) {
	const { t } = useTranslation("fabble");
	const [setExpanded, setSetExpanded] = useState(false);

	const value = feedback.isRainbow
		? t("feedback.all_colors")
		: feedback.column === "type"
			? t(`types.${feedback.guessDisplay}`)
			: feedback.guessDisplay || t("feedback.none");

	const ariaKey = feedback.notApplicable
		? "not_applicable"
		: (feedback.direction ?? feedback.state);
	const ariaLabel = t(`feedback.aria.${ariaKey}`, {
		column: t(`feedback.columns.${feedback.column}`),
		value,
		shared: feedback.shared?.join(", "),
		revealed: feedback.revealedValue,
	});

	return (
		<div
			role="note"
			style={style}
			aria-label={ariaLabel}
			className={`fabble-tile ${flip ? "fabble-tile--flip" : ""} ${STATE_BG[feedback.state]} ${STATE_TEXT[feedback.state]} flex min-h-22 flex-col justify-between gap-1 rounded-md p-2`}
		>
			<div className="flex items-start justify-between gap-1">
				<span className="text-[10px] font-semibold tracking-wide uppercase">
					{t(`feedback.columns.${feedback.column}`)}
				</span>
				<StateIcon feedback={feedback} />
			</div>

			{feedback.column === "set" && feedback.setDetails ? (
				<SetTileBody
					setDetails={feedback.setDetails}
					expanded={setExpanded}
					onExpand={() => setSetExpanded(true)}
				/>
			) : (
				<span className="flex items-center gap-1 text-sm font-bold">
					{value}
					{feedback.direction === "higher" && (
						<ArrowUp className="h-3.5 w-3.5" />
					)}
					{feedback.direction === "lower" && (
						<ArrowDown className="h-3.5 w-3.5" />
					)}
					{feedback.revealedValue && (
						<span className="text-xs font-normal opacity-80">
							({feedback.revealedValue})
						</span>
					)}
				</span>
			)}
		</div>
	);
}

function StateIcon({ feedback }: { feedback: ColumnFeedback }) {
	if (feedback.notApplicable) return <Ban className="h-3.5 w-3.5 shrink-0" />;
	if (feedback.state === "match")
		return <Check className="h-3.5 w-3.5 shrink-0" />;
	if (feedback.state === "partial")
		return <span className="text-xs leading-none">≈</span>;
	return <span className="text-xs leading-none">✕</span>;
}

function SetTileBody({
	setDetails,
	expanded,
	onExpand,
}: {
	setDetails: NonNullable<ColumnFeedback["setDetails"]>;
	expanded: boolean;
	onExpand: () => void;
}) {
	const checkedFirst = [...setDetails].sort((a, b) => {
		if (a.mark === "check" && b.mark !== "check") return -1;
		if (a.mark !== "check" && b.mark === "check") return 1;
		return 0;
	});
	const visible = expanded
		? checkedFirst
		: checkedFirst.slice(0, MAX_VISIBLE_SET_ENTRIES);
	const remaining = checkedFirst.length - visible.length;

	return (
		<div className="flex flex-col gap-0.5 text-[11px] leading-tight font-medium">
			{visible.map((s) => (
				<span key={s.code} className="flex items-center justify-between gap-1">
					<span className="truncate">{s.code}</span>
					{s.mark === "check" && <Check className="h-3 w-3 shrink-0" />}
					{s.mark === "higher" && <ArrowUp className="h-3 w-3 shrink-0" />}
					{s.mark === "lower" && <ArrowDown className="h-3 w-3 shrink-0" />}
				</span>
			))}
			{remaining > 0 && (
				<button
					type="button"
					onClick={onExpand}
					className="text-left text-[10px] opacity-80 underline-offset-2 hover:underline"
				>
					+{remaining} more…
				</button>
			)}
		</div>
	);
}
