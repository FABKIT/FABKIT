import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { Check, Copy, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ShareLinkDialogProps {
	open: boolean;
	onClose: () => void;
	url: string;
	hasUnshareableCardBack: boolean;
}

export function ShareLinkDialog({
	open,
	onClose,
	url,
	hasUnshareableCardBack,
}: ShareLinkDialogProps) {
	const { t } = useTranslation("card-creator");
	const [copied, setCopied] = useState(false);

	const copyToClipboard = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
		} catch (error) {
			console.error("[share-link] Failed to copy to clipboard.", error);
		}
	}, []);

	// Copy as soon as the dialog opens, so "Share" is a single click; the
	// button below is a fallback for a re-copy or a denied clipboard
	// permission. Re-runs if `url` changes while open (new data shared
	// without closing first), not just on the open transition.
	useEffect(() => {
		if (!open) return;
		setCopied(false);
		copyToClipboard(url);
	}, [open, url, copyToClipboard]);

	return (
		<Dialog open={open} onClose={onClose} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="relative w-full max-w-lg space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<button
						type="button"
						onClick={onClose}
						aria-label={t("components.share-link.close")}
						className="absolute right-4 top-4 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-heading"
					>
						<X className="h-4 w-4" />
					</button>

					<div className="space-y-1 pr-8">
						<DialogTitle className="text-lg font-bold text-heading">
							{t("components.share-link.title")}
						</DialogTitle>
						<p className="text-sm text-muted">
							{t("components.share-link.prompt")}
						</p>
					</div>

					{hasUnshareableCardBack && (
						<p className="flex items-start gap-2 text-sm text-muted">
							<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
							{t("components.share-link.custom_frame_warning")}
						</p>
					)}

					<div className="flex flex-col gap-2 sm:flex-row">
						<input
							type="text"
							readOnly
							value={url}
							onFocus={(event) => event.currentTarget.select()}
							className="flex-1 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-body"
						/>
						<button
							type="button"
							onClick={() => copyToClipboard(url)}
							className="inline-flex items-center justify-center gap-x-1.5 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						>
							{copied ? (
								<Check className="w-4 h-4" />
							) : (
								<Copy className="w-4 h-4" />
							)}
							{copied
								? t("components.share-link.copied")
								: t("components.share-link.copy")}
						</button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
