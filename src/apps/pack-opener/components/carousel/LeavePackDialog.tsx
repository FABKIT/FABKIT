import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export interface LeavePackDialogProps {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/** Confirms discarding an in-flight pack before switching sets — see the
 * execution plan, section 1.5. The carousel now stays visible while a pack
 * is tearing or revealing, letting a player switch sets mid-pack, but an
 * abandoned pack must never silently vanish from what the player thinks
 * they pulled. This dialog is the gate between "the carousel let them tap
 * another set" and stores/pack-opener.ts's selectSet(), which is itself
 * unconditional and simply discards the current pack once called — nothing
 * here is recorded into session stats, on purpose (Louis's decision: stats
 * should only ever reflect cards a player actually saw).
 *
 * Default focus sits on "keep opening" (the safe choice) so an accidental
 * Enter can never switch sets out from under someone. Centred with the same
 * lg:pl-72 sidebar offset as SetInfoDialog.tsx and SessionStatsDialog.tsx. */
export function LeavePackDialog({
	open,
	onConfirm,
	onCancel,
}: LeavePackDialogProps) {
	const { t } = useTranslation("pack-opener");
	const keepOpeningRef = useRef<HTMLButtonElement>(null);

	return (
		<Dialog
			open={open}
			onClose={onCancel}
			initialFocus={keepOpeningRef}
			className="relative z-50"
		>
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4 lg:pl-72">
				<DialogPanel className="w-full max-w-sm space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{t("carousel.leave_pack_title")}
					</DialogTitle>
					<p className="text-sm text-muted">{t("carousel.leave_pack_body")}</p>
					<div className="flex flex-col gap-2 sm:flex-row-reverse">
						<button
							type="button"
							onClick={onConfirm}
							className="flex-1 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						>
							{t("carousel.leave_pack_confirm")}
						</button>
						<button
							ref={keepOpeningRef}
							type="button"
							onClick={onCancel}
							className="flex-1 rounded-md border border-border-primary px-3.5 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-surface-active"
						>
							{t("carousel.leave_pack_cancel")}
						</button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
