import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CardThumbnail } from "../components/gallery/CardThumbnail";
import { getAllCards, importCardFromJSON } from "../persistence/card-storage";

export const Route = createFileRoute("/gallery")({
	component: GalleryPage,
	loader: async () => ({ cards: await getAllCards() }),
});

function GalleryPage() {
	const { t } = useTranslation();
	const { cards } = Route.useLoaderData();
	const router = useRouter();
	const [isDragging, setIsDragging] = useState(false);
	const [isImporting, setIsImporting] = useState(false);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		// Only set to false if leaving the container entirely
		if (e.currentTarget === e.target) {
			setIsDragging(false);
		}
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const files = Array.from(e.dataTransfer.files);
		const fabkitFiles = files.filter(
			(file) =>
				file.name.endsWith(".fabkit") ||
				file.type === "application/fabkit+json",
		);

		if (fabkitFiles.length === 0) {
			alert(t("gallery.import_error_invalid_file"));
			return;
		}

		setIsImporting(true);

		try {
			for (const file of fabkitFiles) {
				const text = await file.text();
				await importCardFromJSON(text);
			}

			// Reload the gallery to show the imported cards
			router.invalidate();
		} catch (error) {
			console.error("Failed to import card:", error);
			alert(t("gallery.import_error"));
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<section
			aria-label={t("gallery.title")}
			className="flex flex-1 flex-col"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{/* Drag overlay */}
			{isDragging && (
				<div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
					<div className="rounded-lg border-2 border-dashed border-heading bg-surface p-8 text-center">
						<p className="text-xl font-semibold text-heading">
							{t("gallery.drop_to_import")}
						</p>
						<p className="mt-2 text-sm text-muted">
							{t("gallery.drop_to_import_subtitle")}
						</p>
					</div>
				</div>
			)}

			{/* Importing overlay */}
			{isImporting && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
					<div className="rounded-lg bg-surface p-8 text-center shadow-lg">
						<p className="text-xl font-semibold text-heading">
							{t("gallery.importing")}
						</p>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="border-b border-border-primary px-6 py-4">
				<h1 className="text-2xl font-bold text-heading">
					{t("gallery.title")}
				</h1>
				<p className="text-sm text-muted">{t("gallery.subtitle")}</p>
			</div>

			{/* Content */}
			<div className="flex-1 p-6">
				{cards.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 py-16">
						<p className="text-lg text-muted">{t("gallery.empty")}</p>
						<Link
							to="/card-creator"
							className="rounded-lg bg-surface-active px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
						>
							{t("gallery.create_first")}
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{cards.map((card) => (
							<CardThumbnail key={card.version} card={card} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}
