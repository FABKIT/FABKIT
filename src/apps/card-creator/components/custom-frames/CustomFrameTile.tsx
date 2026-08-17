import {
	countCardsUsingFrame,
	getFrameImageByPayloadHash,
} from "@fabkit/apps/card-creator/persistence/custom-frames-storage.ts";
import type { CustomFrameGroup } from "@fabkit/apps/card-creator/stores/custom-frames.ts";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CustomFrameTileProps {
	group: CustomFrameGroup;
	onRequestEditAvailability: (group: CustomFrameGroup) => void;
	onRequestDeleteWhole: (group: CustomFrameGroup) => void;
}

/**
 * One tile per UPLOADED IMAGE, not per (image, bucket) mirror row — a single
 * upload can be available on several frame buckets, and showing one
 * indistinguishable tile per mirror would make the grid look duplicated.
 * Each mirror is instead a read-only chip within the tile; availability is
 * changed as a whole via "Edit availability", not per chip, since
 * deleteCustomFrameMirror cascade-deletes the underlying image once its last
 * mirror goes and a stray click on a chip is an easy way to lose an upload.
 */
export function CustomFrameTile({
	group,
	onRequestEditAvailability,
	onRequestDeleteWhole,
}: CustomFrameTileProps) {
	const { t } = useTranslation("card-creator");

	// The registry's objectUrl points at the full 900×1256 render asset — fine
	// for a card face, wasteful for a grid of thumbnails. The 225×314 preview
	// blob exists in frameImages specifically for this (and .fabreport), but
	// isn't part of the registry's CardCreatorCardBack shape, so it's fetched
	// and turned into its own, component-owned object URL here rather than
	// reusing the registry's. Local effect + revoke-on-cleanup is the right
	// pattern for this blob (unlike the card-back render layer — see
	// stores/custom-frames.ts's module doc comment) since nothing else needs
	// this URL to exist before first paint.
	const [previewUrl, setPreviewUrl] = useState<string | undefined>();
	useEffect(() => {
		let url: string | undefined;
		let cancelled = false;
		getFrameImageByPayloadHash(group.payloadHash).then((image) => {
			if (cancelled || !image) return;
			url = URL.createObjectURL(image.preview);
			setPreviewUrl(url);
		});
		return () => {
			cancelled = true;
			if (url) URL.revokeObjectURL(url);
		};
	}, [group.payloadHash]);

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
					<MirrorChip key={mirror.id} mirror={mirror} />
				))}
			</div>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => onRequestEditAvailability(group)}
					className="flex flex-1 items-center justify-center gap-2 rounded-md bg-surface-active px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
				>
					<SlidersHorizontal className="h-4 w-4" />
					{t("custom_frames.edit_availability")}
				</button>
				<button
					type="button"
					onClick={() => onRequestDeleteWhole(group)}
					className="flex items-center justify-center rounded-md bg-surface-active px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
					aria-label={t("custom_frames.delete_whole_frame")}
					title={t("custom_frames.delete_whole_frame")}
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

function MirrorChip({
	mirror,
}: {
	mirror: CustomFrameGroup["mirrors"][number];
}) {
	const { t } = useTranslation("card-creator");
	const familyLabel = t(`custom_frames.family.${mirror.type}`);
	const styleLabel = t(
		`custom_frames.style.${mirror.dented ? "dented" : "flat"}`,
	);

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

	return (
		<span
			title={
				usageCount !== null
					? usageCount === 0
						? t("custom_frames.mirror_usage_none")
						: t("custom_frames.mirror_usage_count", { count: usageCount })
					: undefined
			}
			className="flex items-center gap-1 rounded-full border border-border-primary bg-surface-muted px-2.5 py-1 text-xs text-muted"
		>
			{familyLabel} · {styleLabel}
			{usageCount !== null && usageCount > 0 && (
				<span className="rounded-full bg-surface-active px-1.5 text-[10px] text-subtle">
					{usageCount}
				</span>
			)}
		</span>
	);
}
