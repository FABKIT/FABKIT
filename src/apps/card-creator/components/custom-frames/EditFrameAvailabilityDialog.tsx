import {
	FrameBuckets,
	getBucketKeyForFrame,
} from "@fabkit/apps/card-creator/config/frame-buckets.ts";
import type { CardCreatorCardBack } from "@fabkit/apps/card-creator/config/rendering.ts";
import {
	addCustomFrameMirror,
	countCardsUsingAnyFrame,
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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FrameAvailabilityPicker } from "./FrameAvailabilityPicker.tsx";

interface EditFrameAvailabilityDialogProps {
	group: CustomFrameGroup | null;
	onClose: () => void;
	onSaved: () => void;
}

function buildKeyToMirrors(
	group: CustomFrameGroup | null,
): Map<string, CardCreatorCardBack[]> {
	const map = new Map<string, CardCreatorCardBack[]>();
	if (!group) return map;
	for (const mirror of group.mirrors) {
		const key = getBucketKeyForFrame(mirror);
		const list = map.get(key) ?? [];
		list.push(mirror);
		map.set(key, list);
	}
	return map;
}

/**
 * Lets the user change which frame buckets an already-uploaded image is
 * available for, from the Custom Frames page. Shares FrameAvailabilityPicker
 * with the upload dialog. Two steps: "pick" (the picker itself) and
 * "confirm" (shown only when the diff removes a bucket that a saved card is
 * currently using — skipped entirely otherwise).
 */
export function EditFrameAvailabilityDialog({
	group,
	onClose,
	onSaved,
}: EditFrameAvailabilityDialogProps) {
	const { t } = useTranslation("card-creator");

	const keyToMirrors = useMemo(() => buildKeyToMirrors(group), [group]);
	const initialKeys = useMemo(
		() => new Set(keyToMirrors.keys()),
		[keyToMirrors],
	);

	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(initialKeys);
	const [step, setStep] = useState<"pick" | "confirm">("pick");
	const [confirmCount, setConfirmCount] = useState(0);
	const [isSaving, setIsSaving] = useState(false);

	// Reset local state whenever a different frame is opened for editing (or
	// the dialog is closed, group becomes null and the picker is unmounted by
	// `open={group !== null}` anyway).
	useEffect(() => {
		setSelectedKeys(new Set(initialKeys));
		setStep("pick");
		setConfirmCount(0);
	}, [initialKeys]);

	const toggleBucket = (key: string) => {
		setSelectedKeys((current) => {
			const next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const removedKeys = useMemo(
		() => Array.from(initialKeys).filter((key) => !selectedKeys.has(key)),
		[initialKeys, selectedKeys],
	);
	const addedKeys = useMemo(
		() => Array.from(selectedKeys).filter((key) => !initialKeys.has(key)),
		[initialKeys, selectedKeys],
	);
	const hasChanges = removedKeys.length > 0 || addedKeys.length > 0;
	const isEmpty = selectedKeys.size === 0;

	const applyChanges = async () => {
		if (!group) return;
		setIsSaving(true);
		try {
			for (const key of addedKeys) {
				const bucket = FrameBuckets.find((b) => b.key === key);
				if (!bucket) continue;
				await addCustomFrameMirror(group.payloadHash, {
					name: group.name,
					type: bucket.type,
					dented: bucket.style === "dented",
					renderer: bucket.renderer,
					mirrorsCardBackId: bucket.representativeCardBackId,
				});
			}
			for (const key of removedKeys) {
				// A bucket key can map to more than one mirror row (e.g. a card
				// imported from a pre-bucket-model .fabkit export can carry a
				// mirrorsCardBackId that isn't this bucket's representative) —
				// every mirror at this key must go, not just the first.
				for (const mirror of keyToMirrors.get(key) ?? []) {
					await deleteCustomFrameMirror(mirror.id);
				}
			}
			await reloadCustomFrames();
			broadcastCustomFramesChanged();
			onSaved();
		} finally {
			setIsSaving(false);
		}
	};

	const handleSave = async () => {
		if (!hasChanges || isEmpty) return;
		if (step === "pick") {
			const removedMirrorIds = removedKeys.flatMap((key) =>
				(keyToMirrors.get(key) ?? []).map((m) => m.id),
			);
			if (removedMirrorIds.length > 0) {
				const count = await countCardsUsingAnyFrame(removedMirrorIds);
				if (count > 0) {
					setConfirmCount(count);
					setStep("confirm");
					return;
				}
			}
		}
		await applyChanges();
	};

	return (
		<Dialog open={group !== null} onClose={onClose} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="w-full max-w-md space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					{group && step === "pick" && (
						<>
							<div className="space-y-1">
								<DialogTitle className="text-lg font-bold text-heading">
									{t("custom_frames.edit_dialog.title", { name: group.name })}
								</DialogTitle>
								<p className="text-sm text-muted">
									{t("custom_frames.edit_dialog.description")}
								</p>
							</div>

							<div className="max-h-80 overflow-y-auto pr-1">
								<FrameAvailabilityPicker
									selectedKeys={selectedKeys}
									onToggle={toggleBucket}
								/>
							</div>

							{isEmpty && (
								<p className="text-sm text-subtle">
									{t("custom_frames.edit_dialog.empty_hint")}
								</p>
							)}

							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={onClose}
									className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
								>
									{t("custom_frames.edit_dialog.cancel")}
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={!hasChanges || isEmpty || isSaving}
									className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{t("custom_frames.edit_dialog.save")}
								</button>
							</div>
						</>
					)}

					{group && step === "confirm" && (
						<>
							<DialogTitle className="text-lg font-bold text-heading">
								{t("custom_frames.edit_dialog.confirm_title")}
							</DialogTitle>
							<p className="text-sm text-muted">
								{t("custom_frames.edit_dialog.confirm_description", {
									count: confirmCount,
								})}
							</p>
							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setStep("pick")}
									className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
								>
									{t("custom_frames.edit_dialog.confirm_back")}
								</button>
								<button
									type="button"
									onClick={applyChanges}
									disabled={isSaving}
									className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isSaving
										? t("custom_frames.edit_dialog.saving")
										: t("custom_frames.edit_dialog.confirm_save")}
								</button>
							</div>
						</>
					)}
				</DialogPanel>
			</div>
		</Dialog>
	);
}
