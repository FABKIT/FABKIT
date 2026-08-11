import { CustomFrameDialog } from "@fabkit/apps/card-creator/components/custom-frames/CustomFrameDialog.tsx";
import {
	CustomFrameTile,
	type MirrorDeleteRequest,
} from "@fabkit/apps/card-creator/components/custom-frames/CustomFrameTile.tsx";
import {
	DeleteFrameConfirmDialog,
	type DeleteFrameTarget,
} from "@fabkit/apps/card-creator/components/custom-frames/DeleteFrameConfirmDialog.tsx";
import {
	type CustomFrameGroup,
	ensureCustomFramesLoaded,
	getCustomFramesGroupedByImage,
	useCustomFrames,
} from "@fabkit/apps/card-creator/stores/custom-frames.ts";
import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/custom-frames")({
	component: CustomFramesPage,
	loader: async () => {
		await ensureCustomFramesLoaded();
	},
});

function CustomFramesPage() {
	const { t } = useTranslation("card-creator");

	// Subscribes to the registry so the grid re-renders after an upload/delete
	// (including a diffing reload triggered by another tab).
	// getCustomFramesGroupedByImage reads the registry's singleton state
	// directly rather than through the subscribed value, so `frames` is only
	// referenced as a useMemo dependency (see useAvailableCardBacks.ts for the
	// same pattern) — the grid's own unit is the uploaded image, not the row,
	// see getCustomFramesGroupedByImage's doc comment.
	const frames = useCustomFrames();
	const groups = useMemo(() => {
		void frames;
		return getCustomFramesGroupedByImage();
	}, [frames]);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<DeleteFrameTarget | null>(
		null,
	);

	const requestDeleteMirror = ({ group, mirrorId }: MirrorDeleteRequest) =>
		setDeleteTarget({ kind: "mirror", group, mirrorId });
	const requestDeleteWhole = (group: CustomFrameGroup) =>
		setDeleteTarget({ kind: "whole", group });

	return (
		<section
			aria-label={t("custom_frames.title")}
			className="flex flex-1 flex-col"
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border-primary px-6 py-4">
				<div>
					<h1 className="text-2xl font-bold text-heading">
						{t("custom_frames.title")}
					</h1>
					<p className="text-sm text-muted">{t("custom_frames.subtitle")}</p>
				</div>
				<button
					type="button"
					onClick={() => setIsDialogOpen(true)}
					className="inline-flex shrink-0 items-center justify-center gap-x-1.5 whitespace-nowrap rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
				>
					<Upload className="h-4 w-4 shrink-0" />
					{t("custom_frames.upload_label")}
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 p-6">
				{groups.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 py-16">
						<p className="text-lg text-muted">{t("custom_frames.empty")}</p>
						<p className="max-w-md text-center text-sm text-subtle">
							{t("custom_frames.empty_hint")}
						</p>
						<button
							type="button"
							onClick={() => setIsDialogOpen(true)}
							className="rounded-lg bg-surface-active px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
						>
							{t("custom_frames.upload_label")}
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{groups.map((group) => (
							<CustomFrameTile
								key={group.payloadHash}
								group={group}
								onRequestDeleteMirror={requestDeleteMirror}
								onRequestDeleteWhole={requestDeleteWhole}
							/>
						))}
					</div>
				)}
			</div>

			<CustomFrameDialog
				key={isDialogOpen ? "upload-open" : "upload-closed"}
				open={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
			/>
			<DeleteFrameConfirmDialog
				target={deleteTarget}
				onCancel={() => setDeleteTarget(null)}
				onDeleted={() => setDeleteTarget(null)}
			/>
		</section>
	);
}
