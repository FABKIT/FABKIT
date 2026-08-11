import { countCardsUsingFrame } from "@fabkit/apps/card-creator/persistence/custom-frames-storage.ts";
import type { CustomFrameGroup } from "@fabkit/apps/card-creator/stores/custom-frames.ts";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface MirrorDeleteRequest {
	group: CustomFrameGroup;
	mirrorId: number;
}

interface CustomFrameTileProps {
	group: CustomFrameGroup;
	onRequestDeleteMirror: (request: MirrorDeleteRequest) => void;
	onRequestDeleteWhole: (group: CustomFrameGroup) => void;
}

/**
 * One tile per UPLOADED IMAGE, not per (image, stock entry) mirror row — a
 * single upload can be mirrored onto several card type/style combos, and
 * showing one indistinguishable tile per mirror would make the grid look
 * duplicated. Each mirror is instead a removable chip within the tile.
 */
export function CustomFrameTile({
	group,
	onRequestDeleteMirror,
	onRequestDeleteWhole,
}: CustomFrameTileProps) {
	const { t } = useTranslation("card-creator");

	// The registry's objectUrl is what's actually rendered on cards, but the
	// grid wants the smaller preview blob — resolved separately here rather
	// than reusing the registry's URL, since this tile doesn't need the
	// registry to have hydrated the full-res image at all.
	const previewUrl = group.mirrors[0]?.images[0]?.objectUrl;

	const formatDate = (timestamp: number) =>
		new Date(timestamp).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border-primary bg-surface p-4 transition-colors hover:bg-surface-muted">
			<div className="relative aspect-3/4 overflow-hidden rounded-md bg-surface-muted">
				{previewUrl && (
					<img
						src={previewUrl}
						alt={t("custom_frames.preview_alt", { name: group.name })}
						className="h-full w-full object-contain"
					/>
				)}
			</div>

			<div className="flex flex-col gap-1">
				<h3 className="truncate font-semibold text-heading" title={group.name}>
					{group.name}
				</h3>
				<p className="text-xs text-subtle">{formatDate(group.createdAt)}</p>
			</div>

			<div className="flex flex-wrap gap-1.5">
				{group.mirrors.map((mirror) => (
					<MirrorChip
						key={mirror.id}
						mirror={mirror}
						onRequestDelete={() =>
							onRequestDeleteMirror({ group, mirrorId: mirror.id })
						}
					/>
				))}
			</div>

			<button
				type="button"
				onClick={() => onRequestDeleteWhole(group)}
				className="flex items-center justify-center gap-2 rounded-md bg-surface-active px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
			>
				<Trash2 className="h-4 w-4" />
				{t("custom_frames.delete_whole_frame")}
			</button>
		</div>
	);
}

function MirrorChip({
	mirror,
	onRequestDelete,
}: {
	mirror: CustomFrameGroup["mirrors"][number];
	onRequestDelete: () => void;
}) {
	const { t } = useTranslation("card-creator");
	const styleLabel = mirror.dented
		? t("custom_frames.dialog.mirror_style_dented")
		: t("custom_frames.dialog.mirror_style_flat");

	// Per-mirror usage count, fetched once per chip — cheap (a full-table
	// filter over `cards`, see countCardsUsingFrame) and only runs for the
	// mirrors actually rendered on this page.
	const [usageCount, setUsageCount] = useState<number | null>(null);
	useEffect(() => {
		let cancelled = false;
		countCardsUsingFrame(mirror.id).then((count) => {
			if (!cancelled) setUsageCount(count);
		});
		return () => {
			cancelled = true;
		};
	}, [mirror.id]);

	const usageLabel =
		usageCount === null
			? null
			: usageCount === 0
				? t("custom_frames.mirror_usage_none")
				: t("custom_frames.mirror_usage_count", { count: usageCount });

	return (
		<button
			type="button"
			onClick={onRequestDelete}
			title={
				usageLabel
					? `${t("custom_frames.remove_mirror", { style: styleLabel })} — ${usageLabel}`
					: t("custom_frames.remove_mirror", { style: styleLabel })
			}
			className="group flex items-center gap-1 rounded-full border border-border-primary bg-surface-muted px-2.5 py-1 text-xs text-muted transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
		>
			{styleLabel}
			{usageCount !== null && usageCount > 0 && (
				<span className="rounded-full bg-surface-active px-1.5 text-[10px] text-subtle">
					{usageCount}
				</span>
			)}
			<Trash2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
		</button>
	);
}
