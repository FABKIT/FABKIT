import { useNavigate } from "@tanstack/react-router";
import { Download, Edit, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	deleteCard,
	deserializeCardState,
	downloadCardJSON,
	exportCardToJSON,
	type StoredCard,
} from "../../persistence/card-storage";
import { useCardCreator } from "../../stores/card-creator";

interface CardThumbnailProps {
	card: StoredCard;
}

export function CardThumbnail({ card }: CardThumbnailProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [isExporting, setIsExporting] = useState(false);

	// Create object URL for preview with cleanup
	const previewUrl = useMemo(
		() => URL.createObjectURL(card.preview),
		[card.preview],
	);

	useEffect(() => {
		return () => URL.revokeObjectURL(previewUrl);
	}, [previewUrl]);

	const handleEdit = async () => {
		if (!confirm(t("gallery.edit_warning"))) return;

		const state = deserializeCardState(card.state);
		useCardCreator.getState().loadCard(state);
		navigate({ to: "/card-creator" });
	};

	const handleDelete = async () => {
		if (!confirm(t("gallery.delete_confirm"))) return;

		try {
			await deleteCard(card.version);
			// Reload the page to refresh the gallery
			window.location.reload();
		} catch (error) {
			console.error("Failed to delete card:", error);
			alert("Failed to delete card. Please try again.");
		}
	};

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const jsonString = await exportCardToJSON(card);
			downloadCardJSON(jsonString, card.cardName);
		} catch (error) {
			console.error("Failed to export card:", error);
			alert("Failed to export card. Please try again.");
		} finally {
			setIsExporting(false);
		}
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border-primary bg-surface p-4 transition-colors hover:bg-surface-muted">
			{/* Preview Image */}
			<div className="aspect-3/4 overflow-hidden rounded-md bg-surface-muted">
				<img
					src={previewUrl}
					alt={card.cardName}
					className="h-full w-full object-contain"
				/>
			</div>

			{/* Card Info */}
			<div className="flex flex-col gap-1">
				<h3
					className="truncate font-semibold text-heading"
					title={card.cardName}
				>
					{card.cardName}
				</h3>
				<p className="text-xs text-subtle">{formatDate(card.updatedAt)}</p>
			</div>

			{/* Actions */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={handleEdit}
					className="flex flex-1 items-center justify-center gap-2 rounded-md bg-surface-active px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
				>
					<Edit className="h-4 w-4" />
					{t("gallery.edit")}
				</button>
				<button
					type="button"
					onClick={handleExport}
					disabled={isExporting}
					className="flex items-center justify-center gap-2 rounded-md bg-surface-active px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted disabled:opacity-50"
					title={t("gallery.export")}
				>
					<Download className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={handleDelete}
					className="flex items-center justify-center gap-2 rounded-md bg-surface-active px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
					title={t("gallery.delete")}
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
