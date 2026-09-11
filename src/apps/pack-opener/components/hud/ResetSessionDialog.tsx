import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export interface ResetSessionDialogProps {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	/** Shown in the body so the player can see what they are about to lose
	 * without closing this and going to look. */
	packsOpened: number;
}

/** Confirms wiping the session before stores/pack-opener.ts's
 * resetSession() runs. Same gate, same reasoning and the same shape as
 * LeavePackDialog.tsx: the session ledger is the only record a run has,
 * nothing about it is persisted, and there is no undo, so it is not
 * something a mis-tap on a crowded button bar should be able to do.
 *
 * Default focus sits on "keep my session" (the safe choice) so an
 * accidental Enter cannot throw a run away, and the panel carries the same
 * lg:pl-72 sidebar offset as every other dialog in this app. */
export function ResetSessionDialog({
	open,
	onConfirm,
	onCancel,
	packsOpened,
}: ResetSessionDialogProps) {
	const { t } = useTranslation("pack-opener");
	const cancelRef = useRef<HTMLButtonElement>(null);

	return (
		<Dialog
			open={open}
			onClose={onCancel}
			initialFocus={cancelRef}
			className="relative z-50"
		>
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4 lg:pl-72">
				<DialogPanel className="w-full max-w-sm space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{t("reset.title")}
					</DialogTitle>
					<p className="text-sm text-muted">
						{t("reset.body", { count: packsOpened })}
					</p>
					<div className="flex flex-col gap-2 sm:flex-row-reverse">
						<button
							type="button"
							onClick={onConfirm}
							className="flex-1 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						>
							{t("reset.confirm")}
						</button>
						<button
							ref={cancelRef}
							type="button"
							onClick={onCancel}
							className="flex-1 rounded-md border border-border-primary px-3.5 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-surface-active"
						>
							{t("reset.cancel")}
						</button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
