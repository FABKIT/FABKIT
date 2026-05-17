import { useTranslation } from "react-i18next";
import { GUESS_LIMITS } from "../../lib/constants";
import { TileExampleRow } from "./TileExampleRow";

const COLUMN_ENTRIES: [string, string][] = [
	["column.type", "rules.column_description.type"],
	["column.class", "rules.column_description.class"],
	["column.talent", "rules.column_description.talent"],
	["column.pitch", "rules.column_description.pitch"],
	["column.cost", "rules.column_description.cost"],
	["column.power", "rules.column_description.power"],
	["column.defense", "rules.column_description.defense"],
	[
		"column.life_intellect",
		"rules.column_description.life_intellect",
	],
	["column.subtype", "rules.column_description.subtype"],
	["column.keyword", "rules.column_description.keyword"],
	["column.set", "rules.column_description.set"],
];

export function RulesContent() {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex flex-col gap-6 text-sm">
			{/* 1. What is Fabble */}
			<section>
				<h3 className="text-base font-semibold text-heading mb-2">
					{t("rules.section.what_is_fabble")}
				</h3>
				<p className="text-body">{t("rules.what_is_body")}</p>
			</section>

			{/* 2. How to guess */}
			<section>
				<h3 className="text-base font-semibold text-heading mb-2">
					{t("rules.section.how_to_guess")}
				</h3>
				<p className="text-body">{t("rules.how_to_guess_body")}</p>
			</section>

			{/* 3. Feedback states */}
			<section>
				<h3 className="text-base font-semibold text-heading mb-2">
					{t("rules.section.feedback_states")}
				</h3>
				<TileExampleRow />
				<ul className="space-y-1.5 mt-3 text-body">
					<li>
						<strong className="text-fabble-match">
							{t("rules.feedback_state_label.green")}
						</strong>{" "}
						{t("rules.feedback_state.green")}
					</li>
					<li>
						<strong className="text-fabble-partial">
							{t("rules.feedback_state_label.yellow")}
						</strong>{" "}
						{t("rules.feedback_state.yellow")}
					</li>
					<li>
						<strong className="text-fabble-no-match">
							{t("rules.feedback_state_label.red")}
						</strong>{" "}
						{t("rules.feedback_state.red")}
					</li>
				</ul>
			</section>

			{/* 4. Column reference */}
			<section>
				<h3 className="text-base font-semibold text-heading mb-2">
					{t("rules.section.columns")}
				</h3>
				<ul className="space-y-1">
					{COLUMN_ENTRIES.map(([columnKey, descKey]) => (
						<li key={columnKey} className="text-body">
							<span className="font-medium">{t(columnKey)}</span>
							{": "}
							{t(descKey)}
						</li>
					))}
				</ul>
			</section>

			{/* 5. Mode differences */}
			<section>
				<h3 className="text-base font-semibold text-heading mb-2">
					{t("rules.section.modes")}
				</h3>
				<ul className="space-y-1 text-body">
					<li>
						<strong>{t("mode.standard")}:</strong>{" "}
						{t("mode.standard_description")}.{" "}
						{t("mode.guess_limit", { count: GUESS_LIMITS.standard })}.
					</li>
					<li>
						<strong>{t("mode.chaos")}:</strong>{" "}
						{t("mode.chaos_description")}.{" "}
						{t("mode.guess_limit", { count: GUESS_LIMITS.chaos })}.
					</li>
				</ul>
			</section>

			{/* 6. Special rules */}
			<section>
				<h3 className="text-base font-semibold text-heading mb-2">
					{t("rules.section.edge_cases")}
				</h3>
				<ul className="space-y-2 text-body">
					<li>{t("rules.edge_case.rainbow_pitch")}</li>
					<li>{t("rules.edge_case.reprints")}</li>
					<li>{t("rules.edge_case.set_all_printings")}</li>
					<li>{t("rules.edge_case.directional")}</li>
					<li>{t("rules.edge_case.generic")}</li>
				</ul>
			</section>
		</div>
	);
}


