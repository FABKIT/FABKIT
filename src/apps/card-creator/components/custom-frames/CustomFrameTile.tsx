import type { MockCustomFrame } from "@fabkit/apps/card-creator/components/custom-frames/mock-frames.ts";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CustomFrameTileProps {
	frame: MockCustomFrame;
	onRequestDelete: (frame: MockCustomFrame) => void;
}

export function CustomFrameTile({
	frame,
	onRequestDelete,
}: CustomFrameTileProps) {
	const { t } = useTranslation("card-creator");

	const formatDate = (timestamp: number) =>
		new Date(timestamp).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border-primary bg-surface p-4 transition-colors hover:bg-surface-muted">
			<div className="relative aspect-3/4 overflow-hidden rounded-md bg-surface-muted">
				<img
					src={frame.previewUrl}
					alt={t("custom_frames.preview_alt", { name: frame.name })}
					className="h-full w-full object-contain"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<h3 className="truncate font-semibold text-heading" title={frame.name}>
					{frame.name}
				</h3>
				<p className="text-xs text-subtle">{formatDate(frame.createdAt)}</p>
			</div>

			<button
				type="button"
				onClick={() => onRequestDelete(frame)}
				className="flex items-center justify-center gap-2 rounded-md bg-surface-active px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
			>
				<Trash2 className="h-4 w-4" />
				{t("custom_frames.delete")}
			</button>
		</div>
	);
}
