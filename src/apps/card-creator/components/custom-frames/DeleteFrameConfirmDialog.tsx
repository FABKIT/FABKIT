import {
	countCardsUsingAnyFrame,
	countCardsUsingFrame,
	deleteCustomFrameImage,
	deleteCustomFrameMirror,
} from "@fabkit/apps/card-creator/persistence/custom-frames-storage.ts";
import {
	broadcastCustomFramesChanged,
	type CustomFrameGroup,
	reloadCustomFrames,
} from "@fabkit/apps/card-creator/stores/custom-frames.ts";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type DeleteFrameTarget =
	| { kind: "mirror"; group: CustomFrameGroup; mirrorId: number }
	| { kind: "whole"; group: CustomFrameGroup };

interface DeleteFrameConfirmDialogProps {
	target: DeleteFrameTarget | null;
	onCancel: () => void;
	onDeleted: () => void;
}

/**
 * Two distinct delete operations, per the plan: removing one mirror leaves
 * its siblings and the underlying image intact, while deleting the whole
 * frame cascades every mirror plus the image. Both are safe even when a
 * card currently references the frame being removed — thanks to the
 * missing-frame placeholder (config/card-backs.ts), that card's reference is
 * preserved as a placeholder rather than silently destroyed, so this dialog
 * warns about affected cards without needing to actually refuse the delete.
 */
export function DeleteFrameConfirmDialog({
	target,
	onCancel,
	onDeleted,
}: DeleteFrameConfirmDialogProps) {
	const { t } = useTranslation("card-creator");
	const [usageCount, setUsageCount] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (!target) {
			setUsageCount(null);
			return;
		}
		let cancelled = false;
		const count =
			target.kind === "mirror"
				? countCardsUsingFrame(target.mirrorId)
				: // Deduped by card, not summed per mirror — a hybrid card can use
					// two mirrors of the SAME image (left/right), which a per-mirror
					// sum would double-count. See countCardsUsingAnyFrame.
					countCardsUsingAnyFrame(target.group.mirrors.map((m) => m.id));
		count.then((n) => {
			if (!cancelled) setUsageCount(n);
		});
		return () => {
			cancelled = true;
		};
	}, [target]);

	const handleConfirm = async () => {
		if (!target) return;
		setIsDeleting(true);
		try {
			if (target.kind === "mirror") {
				await deleteCustomFrameMirror(target.mirrorId);
			} else {
				await deleteCustomFrameImage(target.group.payloadHash);
			}
			await reloadCustomFrames();
			broadcastCustomFramesChanged();
			onDeleted();
		} finally {
			setIsDeleting(false);
		}
	};

	const name = target?.group.name ?? "";
	const mirror =
		target?.kind === "mirror"
			? target.group.mirrors.find((m) => m.id === target.mirrorId)
			: undefined;
	const styleLabel = mirror
		? mirror.dented
			? t("custom_frames.dialog.mirror_style_dented")
			: t("custom_frames.dialog.mirror_style_flat")
		: "";

	const inUse = (usageCount ?? 0) > 0;
	const title =
		!target || target.kind === "mirror"
			? t("custom_frames.delete_mirror_title", { name, style: styleLabel })
			: t("custom_frames.delete_whole_title", { name });
	const description =
		!target || target.kind === "mirror"
			? inUse
				? t("custom_frames.delete_mirror_confirm_in_use", {
						style: styleLabel,
						count: usageCount ?? 0,
					})
				: t("custom_frames.delete_mirror_confirm", { style: styleLabel, name })
			: inUse
				? t("custom_frames.delete_whole_confirm_in_use", {
						name,
						count: usageCount ?? 0,
					})
				: t("custom_frames.delete_whole_confirm", { name });

	return (
		<Dialog open={target !== null} onClose={onCancel} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="w-full max-w-md space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{title}
					</DialogTitle>
					<p className="text-sm text-muted">{description}</p>
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
							onClick={handleConfirm}
							disabled={isDeleting}
							className="rounded-md bg-surface-active px-4 py-2 text-sm font-semibold text-heading transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
						>
							{t("custom_frames.confirm_delete")}
						</button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
