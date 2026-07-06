import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnFeedback } from "../types";
import { COLUMNS } from "../types";
import { FeedbackTile } from "./FeedbackTile";

interface RulesDialogProps {
	open: boolean;
	onClose: () => void;
}

const EXAMPLE_TILES: { feedback: ColumnFeedback; labelKey: string }[] = [
	{
		feedback: { column: "class", state: "match", guessDisplay: "Ninja" },
		labelKey: "rules.legend.match",
	},
	{
		feedback: {
			column: "class",
			state: "partial",
			guessDisplay: "Ninja",
			shared: ["Ninja"],
		},
		labelKey: "rules.legend.partial",
	},
	{
		feedback: { column: "type", state: "miss", guessDisplay: "action" },
		labelKey: "rules.legend.miss",
	},
	{
		feedback: {
			column: "power",
			state: "miss",
			guessDisplay: "1",
			direction: "higher",
			revealedValue: "3",
		},
		labelKey: "rules.legend.higher",
	},
	{
		feedback: {
			column: "power",
			state: "miss",
			guessDisplay: "5",
			direction: "lower",
			revealedValue: "3",
		},
		labelKey: "rules.legend.lower",
	},
	{
		feedback: {
			column: "cost",
			state: "miss",
			guessDisplay: "3",
			notApplicable: true,
		},
		labelKey: "rules.legend.not_applicable",
	},
];

export function RulesDialog({ open, onClose }: RulesDialogProps) {
	const { t } = useTranslation("fabble");
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			initialFocus={closeButtonRef}
			className="relative z-50"
		>
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="max-h-[85vh] w-full max-w-105 overflow-y-auto space-y-5 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{t("rules.title")}
					</DialogTitle>

					<section className="space-y-1">
						<h3 className="font-semibold text-body">
							{t("rules.what_is_title")}
						</h3>
						<p className="text-sm text-muted">{t("rules.what_is_body")}</p>
					</section>

					<section className="space-y-1">
						<h3 className="font-semibold text-body">
							{t("rules.making_a_guess_title")}
						</h3>
						<p className="text-sm text-muted">
							{t("rules.making_a_guess_body")}
						</p>
					</section>

					<section className="space-y-2">
						<h3 className="font-semibold text-body">
							{t("rules.feedback_title")}
						</h3>
						<div className="flex flex-wrap justify-center gap-2">
							{EXAMPLE_TILES.map(({ feedback, labelKey }) => (
								<div
									key={labelKey}
									className="flex w-20 flex-col items-center gap-1"
								>
									<FeedbackTile feedback={feedback} />
									<span className="text-center text-[11px] text-muted">
										{t(labelKey)}
									</span>
								</div>
							))}
						</div>
						<ul className="space-y-0.5 text-sm">
							<li>
								<span className="font-semibold text-feedback-match">
									{t("rules.legend.green_label")}
								</span>{" "}
								<span className="text-muted">
									{t("rules.legend.green_body")}
								</span>
							</li>
							<li>
								<span className="font-semibold text-feedback-partial">
									{t("rules.legend.yellow_label")}
								</span>{" "}
								<span className="text-muted">
									{t("rules.legend.yellow_body")}
								</span>
							</li>
							<li>
								<span className="font-semibold text-feedback-miss">
									{t("rules.legend.red_label")}
								</span>{" "}
								<span className="text-muted">{t("rules.legend.red_body")}</span>
							</li>
						</ul>
					</section>

					<section className="space-y-1">
						<h3 className="font-semibold text-body">
							{t("rules.columns_title")}
						</h3>
						<ul className="space-y-0.5 text-sm text-muted">
							{COLUMNS.map((column) => (
								<li key={column}>{t(`rules.columns.${column}`)}</li>
							))}
						</ul>
					</section>

					<section className="space-y-1">
						<h3 className="font-semibold text-body">
							{t("rules.modes_title")}
						</h3>
						<p className="text-sm text-muted">
							<strong>{t("home.modes.standard.name")}:</strong>{" "}
							{t("home.modes.standard.blurb")}
						</p>
						<p className="text-sm text-muted">
							<strong>{t("home.modes.chaos.name")}:</strong>{" "}
							{t("home.modes.chaos.blurb")}
						</p>
					</section>

					<button
						ref={closeButtonRef}
						type="button"
						onClick={onClose}
						className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
					>
						{t("common.close")}
					</button>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
