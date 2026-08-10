import { CustomFrameDialog } from "@fabkit/apps/card-creator/components/custom-frames/CustomFrameDialog.tsx";
import { CustomFrameTile } from "@fabkit/apps/card-creator/components/custom-frames/CustomFrameTile.tsx";
import { DeleteFrameConfirmDialog } from "@fabkit/apps/card-creator/components/custom-frames/DeleteFrameConfirmDialog.tsx";
import {
	MOCK_CUSTOM_FRAMES,
	type MockCustomFrame,
} from "@fabkit/apps/card-creator/components/custom-frames/mock-frames.ts";
import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/custom-frames")({
	component: CustomFramesPage,
});

function CustomFramesPage() {
	const { t } = useTranslation("card-creator");
	// Local state stands in for the storage layer, so delete and upload are
	// visually interactive while the real persistence is still to be built.
	const [frames, setFrames] = useState<MockCustomFrame[]>(MOCK_CUSTOM_FRAMES);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<MockCustomFrame | null>(
		null,
	);

	const handleConfirmDelete = () => {
		if (!deleteTarget) return;
		setFrames((current) => current.filter((f) => f.id !== deleteTarget.id));
		setDeleteTarget(null);
	};

	const handleAdd = ({ name, file }: { name: string; file: File }) => {
		setFrames((current) => [
			...current,
			{
				id: `frame-${Date.now()}`,
				name,
				previewUrl: URL.createObjectURL(file),
				createdAt: Date.now(),
			},
		]);
	};

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
				{frames.length === 0 ? (
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
						{frames.map((frame) => (
							<CustomFrameTile
								key={frame.id}
								frame={frame}
								onRequestDelete={setDeleteTarget}
							/>
						))}
					</div>
				)}
			</div>

			<CustomFrameDialog
				key={isDialogOpen ? "upload-open" : "upload-closed"}
				open={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onSubmit={handleAdd}
			/>
			<DeleteFrameConfirmDialog
				frame={deleteTarget}
				onCancel={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
			/>
		</section>
	);
}
