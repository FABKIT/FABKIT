import type { StoredFolder } from "@fabkit/apps/card-creator/persistence/card-storage";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";

interface DeleteFolderConfirmDialogProps {
	folder: StoredFolder | null;
	itemCount: number;
	onCancel: () => void;
	onConfirm: () => void;
}

export function DeleteFolderConfirmDialog({
	folder,
	itemCount,
	onCancel,
	onConfirm,
}: DeleteFolderConfirmDialogProps) {
	const { t } = useTranslation("card-creator");

	return (
		<Dialog open={folder !== null} onClose={onCancel} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="w-full max-w-md space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{t("gallery.folders.delete_title", { name: folder?.name ?? "" })}
					</DialogTitle>
					<p className="text-sm text-muted">
						{itemCount > 0
							? t("gallery.folders.delete_confirm", { count: itemCount })
							: t("gallery.folders.delete_confirm_empty")}
					</p>
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={onCancel}
							className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
						>
							{t("gallery.folders.cancel")}
						</button>
						<button
							type="button"
							onClick={onConfirm}
							className="rounded-md bg-surface-active px-4 py-2 text-sm font-semibold text-heading transition-colors hover:bg-surface-muted"
						>
							{t("gallery.folders.delete")}
						</button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
