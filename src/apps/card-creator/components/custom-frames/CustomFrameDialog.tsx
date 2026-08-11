import type { CardCreatorCardBack } from "@fabkit/apps/card-creator/config/rendering.ts";
import {
	type AddCustomFrameInput,
	addCustomFrameMirror,
	addFrameImageAndMirrors,
	getCustomFramesByPayloadHash,
	getFrameImageByPayloadHash,
} from "@fabkit/apps/card-creator/persistence/custom-frames-storage.ts";
import {
	broadcastCustomFramesChanged,
	reloadCustomFrames,
} from "@fabkit/apps/card-creator/stores/custom-frames.ts";
import {
	assertStorageQuotaAvailable,
	FrameImageError,
	type FrameImageErrorCode,
	type NormalisedFrameImage,
	normaliseFrameImage,
} from "@fabkit/apps/card-creator/utils/frame-image.ts";
import ImageUpload from "@fabkit/platform/components/form/ImageUpload";
import TextInput from "@fabkit/platform/components/form/TextInput";
import { CardBacks } from "@fabkit/shared/config/cards/card_backs.ts";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { Check, ChevronLeft, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface CustomFrameDialogProps {
	open: boolean;
	onClose: () => void;
}

// Meld has no blob-href path in MeldRenderer.tsx yet, so custom frames can't
// be mirrored onto it — see stores/custom-frames.ts's
// getCustomFramesForTypeAndStyle, which excludes it the same way.
const MIRRORABLE_STOCK_BACKS = (CardBacks as CardCreatorCardBack[]).filter(
	(back) => back.type !== "meld",
);

const ERROR_CODE_TO_I18N_KEY: Record<FrameImageErrorCode, string> = {
	"file-too-large": "custom_frames.dialog.error_file_too_large",
	"unrecognized-format": "custom_frames.dialog.error_unrecognized_format",
	unreadable: "custom_frames.dialog.error_unreadable",
	"dimensions-too-large": "custom_frames.dialog.error_dimensions_too_large",
	"quota-exceeded": "custom_frames.dialog.error_quota_exceeded",
};

/**
 * Upload dialog for a user-supplied card frame. Shared by the Custom Frames
 * page and the background picker in the card creator so the two can never
 * drift apart.
 *
 * Two steps: (1) name + image, normalised via normaliseFrameImage on submit;
 * (2) a mirror picker — the user explicitly chooses which stock manifest
 * entries (card type/style combos) this image should be selectable for,
 * since a CardBack's `type` can't be derived from its renderer (see the
 * plan's design overview). Stock entries this exact image is already
 * mirrored onto (by payloadHash) are excluded from the picker, enforcing the
 * (payloadHash, mirrorsCardBackId) uniqueness the plan calls for.
 */
export function CustomFrameDialog({ open, onClose }: CustomFrameDialogProps) {
	const { t } = useTranslation("card-creator");
	const [name, setName] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [step, setStep] = useState<"form" | "mirrors">("form");
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [normalised, setNormalised] = useState<NormalisedFrameImage | null>(
		null,
	);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [alreadyMirroredIds, setAlreadyMirroredIds] = useState<Set<number>>(
		new Set(),
	);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	// Revoke the local preview URL on unmount/replacement — this one is owned
	// by this component (not the registry), so it's fine to use the normal
	// effect-based lifecycle here.
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const availableMirrors = useMemo(
		() =>
			MIRRORABLE_STOCK_BACKS.filter((back) => !alreadyMirroredIds.has(back.id)),
		[alreadyMirroredIds],
	);

	const handleFormSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!file || name.trim().length === 0) return;

		setError(null);
		setIsProcessing(true);
		try {
			const result = await normaliseFrameImage(file);
			const existingMirrors = await getCustomFramesByPayloadHash(
				result.payloadHash,
			);
			setNormalised(result);
			setAlreadyMirroredIds(
				new Set(existingMirrors.map((m) => m.mirrorsCardBackId)),
			);
			setSelectedIds(new Set());
			setPreviewUrl(URL.createObjectURL(result.preview));
			setStep("mirrors");
		} catch (err) {
			const key =
				err instanceof FrameImageError
					? ERROR_CODE_TO_I18N_KEY[err.code]
					: "custom_frames.dialog.error_unknown";
			setError(t(key));
		} finally {
			setIsProcessing(false);
		}
	};

	const toggleMirror = (id: number) => {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleConfirmMirrors = async () => {
		if (!normalised || selectedIds.size === 0) return;

		setError(null);
		setIsSaving(true);
		try {
			const mirrors: AddCustomFrameInput[] = MIRRORABLE_STOCK_BACKS.filter(
				(back) => selectedIds.has(back.id),
			).map((back) => ({
				name: name.trim(),
				type: back.type,
				dented: back.dented,
				renderer: back.renderer,
				mirrorsCardBackId: back.id,
			}));

			const existingImage = await getFrameImageByPayloadHash(
				normalised.payloadHash,
			);
			if (existingImage) {
				for (const mirror of mirrors) {
					await addCustomFrameMirror(normalised.payloadHash, mirror);
				}
			} else {
				await assertStorageQuotaAvailable(
					normalised.image.size + normalised.preview.size,
				);
				await addFrameImageAndMirrors(
					{
						payloadHash: normalised.payloadHash,
						sourceHash: normalised.sourceHash,
						normVersion: normalised.normVersion,
						image: normalised.image,
						preview: normalised.preview,
						byteSize: normalised.byteSize,
					},
					mirrors,
				);
			}

			await reloadCustomFrames();
			broadcastCustomFramesChanged();
			handleClose();
		} catch (err) {
			const key =
				err instanceof FrameImageError
					? ERROR_CODE_TO_I18N_KEY[err.code]
					: "custom_frames.dialog.error_unknown";
			setError(t(key));
		} finally {
			setIsSaving(false);
		}
	};

	const handleClose = () => {
		setName("");
		setFile(null);
		setStep("form");
		setError(null);
		setNormalised(null);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		setAlreadyMirroredIds(new Set());
		setSelectedIds(new Set());
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="relative w-full max-w-md space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<button
						type="button"
						onClick={handleClose}
						aria-label={t("custom_frames.dialog.close")}
						className="absolute right-4 top-4 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-heading"
					>
						<X className="h-4 w-4" />
					</button>

					{step === "form" ? (
						<>
							<div className="space-y-1 pr-8">
								<DialogTitle className="text-lg font-bold text-heading">
									{t("custom_frames.dialog.title")}
								</DialogTitle>
								<p className="text-sm text-muted">
									{t("custom_frames.dialog.description")}
								</p>
							</div>

							<form onSubmit={handleFormSubmit} className="space-y-4">
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
									<ImageUpload
										acceptedFormats={["image/png", "image/webp"]}
										onImageSelect={setFile}
									/>
								</div>

								{error && <p className="text-sm text-red-500">{error}</p>}

								<div className="flex justify-end gap-3">
									<button
										type="button"
										onClick={handleClose}
										className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
									>
										{t("custom_frames.dialog.cancel")}
									</button>
									<button
										type="submit"
										disabled={!file || name.trim().length === 0 || isProcessing}
										className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{isProcessing
											? t("custom_frames.dialog.processing")
											: t("custom_frames.dialog.next")}
									</button>
								</div>
							</form>
						</>
					) : (
						<>
							<div className="space-y-1 pr-8">
								<DialogTitle className="text-lg font-bold text-heading">
									{t("custom_frames.dialog.mirror_title")}
								</DialogTitle>
								<p className="text-sm text-muted">
									{t("custom_frames.dialog.mirror_description")}
								</p>
							</div>

							<div className="flex gap-4">
								{previewUrl && (
									<div className="w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted">
										<img
											src={previewUrl}
											alt={t("custom_frames.preview_alt", { name })}
											className="h-full w-full object-contain"
										/>
									</div>
								)}

								<div className="max-h-64 flex-1 space-y-1 overflow-y-auto pr-1">
									{availableMirrors.length === 0 ? (
										<p className="text-sm text-subtle">
											{t("custom_frames.dialog.mirror_none_left")}
										</p>
									) : (
										availableMirrors.map((back) => {
											const checked = selectedIds.has(back.id);
											return (
												<label
													key={back.id}
													className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-body transition-colors hover:bg-surface-muted"
												>
													<input
														type="checkbox"
														checked={checked}
														onChange={() => toggleMirror(back.id)}
														className="h-4 w-4 accent-primary"
													/>
													<span className="flex-1">
														{back.name} —{" "}
														{back.dented
															? t("custom_frames.dialog.mirror_style_dented")
															: t("custom_frames.dialog.mirror_style_flat")}
													</span>
													{checked && (
														<Check className="h-4 w-4 shrink-0 text-primary" />
													)}
												</label>
											);
										})
									)}
								</div>
							</div>

							{error && <p className="text-sm text-red-500">{error}</p>}

							<div className="flex items-center justify-between gap-3">
								<button
									type="button"
									onClick={() => setStep("form")}
									className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
								>
									<ChevronLeft className="h-4 w-4" />
									{t("custom_frames.dialog.back")}
								</button>
								<button
									type="button"
									onClick={handleConfirmMirrors}
									disabled={selectedIds.size === 0 || isSaving}
									className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isSaving
										? t("custom_frames.dialog.saving")
										: t("custom_frames.dialog.save")}
								</button>
							</div>
						</>
					)}
				</DialogPanel>
			</div>
		</Dialog>
	);
}
