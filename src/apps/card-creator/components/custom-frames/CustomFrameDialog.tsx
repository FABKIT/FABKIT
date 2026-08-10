import ImageUpload from "@fabkit/platform/components/form/ImageUpload";
import TextInput from "@fabkit/platform/components/form/TextInput";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

interface CustomFrameDialogProps {
	open: boolean;
	onClose: () => void;
	/** Not wired to storage yet — the dialog just hands back what was entered. */
	onSubmit?: (frame: { name: string; file: File }) => void;
}

/**
 * Upload dialog for a user-supplied card frame. Shared by the Custom Frames
 * page and the background picker in the card creator so the two can never
 * drift apart.
 *
 * Follows the dialog convention used by FolderNameDialog and the reset dialog:
 * Headless UI Dialog with a dimming backdrop, which also gives Esc-to-close
 * and a focus trap for free.
 */
export function CustomFrameDialog({
	open,
	onClose,
	onSubmit,
}: CustomFrameDialogProps) {
	const { t } = useTranslation("card-creator");
	const [name, setName] = useState("");
	const [file, setFile] = useState<File | null>(null);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!file || name.trim().length === 0) return;
		onSubmit?.({ name: name.trim(), file });
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="relative w-full max-w-md space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<button
						type="button"
						onClick={onClose}
						aria-label={t("custom_frames.dialog.close")}
						className="absolute right-4 top-4 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-heading"
					>
						<X className="h-4 w-4" />
					</button>

					<div className="space-y-1 pr-8">
						<DialogTitle className="text-lg font-bold text-heading">
							{t("custom_frames.dialog.title")}
						</DialogTitle>
						<p className="text-sm text-muted">
							{t("custom_frames.dialog.description")}
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<TextInput
							type="text"
							autoFocus
							value={name}
							onChange={setName}
							label={t("custom_frames.dialog.name_label")}
							placeholder={t("custom_frames.dialog.name_placeholder")}
							maxLength={30}
							required
						/>

						<div className="space-y-1.5">
							<p className="block text-sm font-medium text-muted">
								{t("custom_frames.dialog.image_label")}
								<span className="ml-1 text-primary">*</span>
							</p>
							<ImageUpload onImageSelect={setFile} />
						</div>

						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={onClose}
								className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
							>
								{t("custom_frames.dialog.cancel")}
							</button>
							<button
								type="submit"
								disabled={!file || name.trim().length === 0}
								className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{t("custom_frames.dialog.save")}
							</button>
						</div>
					</form>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
