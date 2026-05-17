import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { RulesContent } from "./RulesContent";

interface RulesModalProps {
	isFirstVisit: boolean;
	onClose: () => void;
}

export function RulesModal({ isFirstVisit, onClose }: RulesModalProps) {
	const { t } = useTranslation("fabble");

	const actionKey = isFirstVisit
		? "rules.action.got_it"
		: "rules.action.close";

	return (
		<Dialog open={true} onClose={onClose} className="relative z-50">
			{/* Overlay */}
			<div className="fixed inset-0 bg-black/50" aria-hidden="true" />

			{/* Modal panel */}
			<div className="fixed inset-0 flex items-center justify-center p-4">
				<DialogPanel className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl overflow-y-auto max-h-[90vh]">
					<div className="flex flex-col gap-6">
						<div className="flex items-start justify-between">
							<DialogTitle className="text-xl font-bold text-heading">
								{t("rules.title")}
							</DialogTitle>
						</div>

						<RulesContent />

						<div className="flex justify-end">
							<button
								type="button"
								onClick={onClose}
								className="min-h-[44px] px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
								// biome-ignore lint/a11y/noAutofocus: intentional - focus rules button on modal open per accessibility spec
								autoFocus
							>
								{t(actionKey)}
							</button>
						</div>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}


