import { useTranslation } from "react-i18next";
import type { FeedbackCell } from "../../lib/types";
import { FeedbackTile } from "../Puzzle/FeedbackTile";

const EXAMPLE_CELLS: Array<{
	id: string;
	cell: FeedbackCell;
	label: string;
	stateLabelKey: string;
	guessValue?: string;
}> = [
	{
		id: "match",
		cell: { state: "match", value: "Ninja" },
		label: "column.class",
		stateLabelKey: "rules.tile_state_label.match",
	},
	{
		id: "partial",
		cell: { state: "partial", guessValue: "Ninja", overlapping: ["Ninja"] },
		label: "column.class",
		stateLabelKey: "rules.tile_state_label.partial",
	},
	{
		id: "no-match",
		cell: { state: "no-match" },
		label: "column.type",
		stateLabelKey: "rules.tile_state_label.no_match",
	},
	{
		id: "no-match-higher",
		cell: { state: "no-match", direction: "higher", revealedDailyValue: 3 },
		label: "column.power",
		stateLabelKey: "rules.tile_state_label.higher",
		guessValue: "1",
	},
	{
		id: "no-match-lower",
		cell: { state: "no-match", direction: "lower", revealedDailyValue: 2 },
		label: "column.power",
		stateLabelKey: "rules.tile_state_label.lower",
		guessValue: "5",
	},
	{
		id: "na",
		cell: { state: "no-match", naDaily: true },
		label: "column.cost",
		stateLabelKey: "rules.tile_state_label.na",
		guessValue: "3",
	},
];

export function TileExampleRow() {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex flex-wrap gap-3 justify-center my-4">
			{EXAMPLE_CELLS.map((example) => (
				<div key={example.id} className="flex flex-col items-center gap-1">
					<FeedbackTile
						cell={example.cell}
						column="class"
						columnLabel={t(example.label)}
						guessValue={example.guessValue}
					/>
					<span className="text-xs text-muted">{t(example.stateLabelKey)}</span>
				</div>
			))}
		</div>
	);
}


