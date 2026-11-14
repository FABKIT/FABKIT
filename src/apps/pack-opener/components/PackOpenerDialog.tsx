import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";
import { type ReactNode, type RefObject, useRef } from "react";
import { useTranslation } from "react-i18next";

const PANEL_CLASS_NAMES = {
	compact:
		"w-full max-w-sm space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl",
	wide: "max-h-[85vh] w-full max-w-105 overflow-y-auto space-y-5 rounded-lg border border-border-primary bg-surface p-6 shadow-xl",
};

interface PackOpenerDialogProps {
	open: boolean;
	onClose: () => void;
	initialFocus: RefObject<HTMLElement | null>;
	size: keyof typeof PANEL_CLASS_NAMES;
	children: ReactNode;
}

/** The Headless UI Dialog pattern from
 * src/apps/fabble/components/RulesDialog.tsx, with the lg:pl-72 offset that
 * keeps every dialog in this app centred clear of the sidebar. */
export function PackOpenerDialog({
	open,
	onClose,
	initialFocus,
	size,
	children,
}: PackOpenerDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			initialFocus={initialFocus}
			className="relative z-50"
		>
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4 lg:pl-72">
				<DialogPanel className={PANEL_CLASS_NAMES[size]}>
					{children}
				</DialogPanel>
			</div>
		</Dialog>
	);
}

interface InfoDialogProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
}

/** A dialog that only informs: a title with a close icon above whatever it has
 * to say, and a close button below, which takes the initial focus. */
export function InfoDialog({
	open,
	onClose,
	title,
	children,
}: InfoDialogProps) {
	const { t } = useTranslation("pack-opener");
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<PackOpenerDialog
			open={open}
			onClose={onClose}
			initialFocus={closeButtonRef}
			size="wide"
		>
			<div className="flex items-start justify-between gap-4">
				<DialogTitle className="text-lg font-bold text-heading">
					{title}
				</DialogTitle>
				<button
					type="button"
					onClick={onClose}
					aria-label={t("common.close")}
					className="shrink-0 rounded-full p-1 text-muted transition-colors hover:text-heading"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{children}

			<button
				ref={closeButtonRef}
				type="button"
				onClick={onClose}
				className="w-full rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
			>
				{t("common.close")}
			</button>
		</PackOpenerDialog>
	);
}
