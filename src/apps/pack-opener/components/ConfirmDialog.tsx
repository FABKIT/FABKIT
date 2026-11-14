import { PackOpenerDialog } from "@fabkit/apps/pack-opener/components/PackOpenerDialog";
import { DialogTitle } from "@headlessui/react";
import { useRef } from "react";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	body: string;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => void;
	onCancel: () => void;
}

/** A gate in front of something that can't be undone. Default focus sits on
 * the cancel button, the safe choice, so an accidental Enter can never go
 * through with it. */
export function ConfirmDialog({
	open,
	title,
	body,
	confirmLabel,
	cancelLabel,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const cancelRef = useRef<HTMLButtonElement>(null);

	return (
		<PackOpenerDialog
			open={open}
			onClose={onCancel}
			initialFocus={cancelRef}
			size="compact"
		>
			<DialogTitle className="text-lg font-bold text-heading">
				{title}
			</DialogTitle>
			<p className="text-sm text-muted">{body}</p>
			<div className="flex flex-col gap-2 sm:flex-row-reverse">
				<button
					type="button"
					onClick={onConfirm}
					className="flex-1 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
				>
					{confirmLabel}
				</button>
				<button
					ref={cancelRef}
					type="button"
					onClick={onCancel}
					className="flex-1 rounded-md border border-border-primary px-3.5 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-surface-active"
				>
					{cancelLabel}
				</button>
			</div>
		</PackOpenerDialog>
	);
}
