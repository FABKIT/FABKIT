import type { MockCustomFrame } from "@fabkit/apps/card-creator/components/custom-frames/mock-frames.ts";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";

interface DeleteFrameConfirmDialogProps {
	frame: MockCustomFrame | null;
	onCancel: () => void;
	onConfirm: () => void;
}

export function DeleteFrameConfirmDialog({
	frame,
	onCancel,
	onConfirm,
}: DeleteFrameConfirmDialogProps) {
	const { t } = useTranslation("card-creator");

	return (
		<Dialog open={frame !== null} onClose={onCancel} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="w-full max-w-md space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{t("custom_frames.delete_title", { name: frame?.name ?? "" })}
					</DialogTitle>
					<p className="text-sm text-muted">
						{t("custom_frames.delete_confirm")}
					</p>
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={onCancel}
							className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
						>
							{t("custom_frames.cancel")}
						</button>
						<button
							type="button"
							onClick={onConfirm}
							className="rounded-md bg-surface-active px-4 py-2 text-sm font-semibold text-heading transition-colors hover:bg-surface-muted"
						>
							{t("custom_frames.delete")}
						</button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
