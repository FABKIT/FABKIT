import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

interface FolderNameDialogProps {
	mode: "create" | "rename";
	open: boolean;
	initialName?: string;
	onClose: () => void;
	onSubmit: (name: string) => Promise<void>;
}

/**
 * card-storage's folder validation throws plain Error objects with a fixed
 * English message (name empty / too long / taken / max depth) — map those
 * back to translated copy rather than surfacing the raw message.
 */
function mapFolderError(error: unknown, t: (key: string) => string): string {
	const message = error instanceof Error ? error.message : "";
	if (message.includes("nested more than")) {
		return t("gallery.folders.max_depth_reached");
	}
	if (message.includes("already exists")) {
		return t("gallery.folders.name_taken");
	}
	if (message.includes("cannot exceed")) {
		return t("gallery.folders.name_too_long");
	}
	return t("gallery.folders.folder_error");
}

export function FolderNameDialog({
	mode,
	open,
	initialName = "",
	onClose,
	onSubmit,
}: FolderNameDialogProps) {
	const { t } = useTranslation("card-creator");
	const [name, setName] = useState(initialName);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);
		try {
			await onSubmit(name.trim());
		} catch (err) {
			setError(mapFolderError(err, t));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="w-full max-w-sm space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{t(
							mode === "create"
								? "gallery.folders.new_folder_title"
								: "gallery.folders.rename_title",
						)}
					</DialogTitle>
					<form onSubmit={handleSubmit} className="space-y-3">
						<input
							type="text"
							autoFocus
							value={name}
							onChange={(e) => setName(e.currentTarget.value)}
							placeholder={t("gallery.folders.folder_name_placeholder")}
							maxLength={20}
							className="w-full rounded-md border border-border-primary bg-surface px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-primary"
						/>
						{error && <p className="text-sm text-heading">{error}</p>}
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={onClose}
								className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
							>
								{t("gallery.folders.cancel")}
							</button>
							<button
								type="submit"
								disabled={isSubmitting || name.trim().length === 0}
								className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{t(
									mode === "create"
										? "gallery.folders.create"
										: "gallery.folders.rename",
								)}
							</button>
						</div>
					</form>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
