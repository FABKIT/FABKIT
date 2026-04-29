import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Download, FolderSync, Loader2, RotateCcw } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardThumbnail } from "../components/gallery/CardThumbnail";
import { FileUploadButton } from "../components/gallery/FileUploadButton.tsx";
import { decompressFile } from "../lib/compression";
import {
	exportGalleryToFile,
	type GalleryImportMode,
	getAllCards,
	importCardFromJSON,
	importGalleryFromJSON,
} from "../persistence/card-storage";

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
	const [isExporting, setIsExporting] = useState(false);
	const [pendingGalleryFile, setPendingGalleryFile] = useState<File | null>(
		null,
	);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		if (e.currentTarget === e.target) {
			setIsDragging(false);
		}
	};

	const processFiles = async (files: File[]) => {
		const galleryFile = files.find((f) => f.name.endsWith(".fabgallery"));
		if (galleryFile) {
			setPendingGalleryFile(galleryFile);
			return;
		}

		const fabkitFiles = files.filter(
			(f) => f.name.endsWith(".fabkit") || f.type === "application/fabkit+json",
		);

		if (fabkitFiles.length === 0) {
			alert(t("gallery.import_error_invalid_file"));
			return;
		}

		setIsImporting(true);
		try {
			for (const file of fabkitFiles) {
				const text = await decompressFile(file);
				await importCardFromJSON(text);
			}
			router.invalidate();
		} catch (error) {
			console.error("Failed to import card:", error);
			alert(t("gallery.import_error"));
		} finally {
			setIsImporting(false);
		}
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		await processFiles(Array.from(e.dataTransfer.files));
	};

	const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
		await processFiles(Array.from(e.currentTarget.files ?? []));
	};

	const handleGalleryImport = async (mode: GalleryImportMode) => {
		if (!pendingGalleryFile) return;
		const file = pendingGalleryFile;
		setPendingGalleryFile(null);
		setIsImporting(true);
		try {
			const text = await decompressFile(file);
			await importGalleryFromJSON(text, mode);
			router.invalidate();
		} catch (error) {
			console.error("Failed to import gallery:", error);
			alert(t("gallery.import_error"));
		} finally {
			setIsImporting(false);
		}
	};

	const handleExportGallery = async () => {
		setIsExporting(true);
		try {
			await exportGalleryToFile(cards);
		} catch (error) {
			console.error("Failed to export gallery:", error);
			alert(t("gallery.export_gallery_error"));
		} finally {
			setIsExporting(false);
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

			{/* Gallery import dialog */}
			{pendingGalleryFile && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
					<div className="mx-4 w-full max-w-md rounded-lg border-2 border-border-primary bg-surface p-6 shadow-xl">
						<h2 className="text-lg font-semibold text-heading mb-2">
							{t("gallery.import_gallery_title")}
						</h2>
						<p className="text-sm text-muted mb-6">
							{t("gallery.import_gallery_description")}
						</p>
						<div className="flex flex-col gap-3">
							<button
								type="button"
								onClick={() => handleGalleryImport("merge")}
								className="flex items-center gap-3 rounded-lg border border-border-primary bg-surface-muted px-4 py-3 text-sm text-body hover:bg-surface-active transition-colors text-left"
							>
								<FolderSync className="h-5 w-5 text-heading flex-shrink-0" />
								<div>
									<p className="font-medium text-heading">
										{t("gallery.import_merge")}
									</p>
									<p className="text-xs text-subtle">
										{t("gallery.import_merge_description")}
									</p>
								</div>
							</button>
							<button
								type="button"
								onClick={() => handleGalleryImport("replace")}
								className="flex items-center gap-3 rounded-lg border border-border-primary bg-surface-muted px-4 py-3 text-sm text-body hover:bg-surface-active transition-colors text-left"
							>
								<RotateCcw className="h-5 w-5 text-heading flex-shrink-0" />
								<div>
									<p className="font-medium text-heading">
										{t("gallery.import_replace")}
									</p>
									<p className="text-xs text-subtle">
										{t("gallery.import_replace_description")}
									</p>
								</div>
							</button>
							<button
								type="button"
								onClick={() => setPendingGalleryFile(null)}
								className="mt-1 text-sm text-subtle hover:text-muted transition-colors"
							>
								{t("gallery.import_cancel")}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between border-b border-border-primary px-6 py-4">
				<div>
					<h1 className="text-2xl font-bold text-heading">
						{t("gallery.title")}
					</h1>
					<p className="text-sm text-muted">{t("gallery.subtitle")}</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleExportGallery}
						disabled={isExporting || cards.length === 0}
						className="flex items-center gap-2 rounded-md border border-border-primary bg-surface px-3.5 py-2.5 text-sm font-semibold text-heading transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isExporting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Download className="h-4 w-4" />
						)}
						{t("gallery.export_gallery")}
					</button>
					<FileUploadButton
						label={t("gallery.import_label")}
						accept=".fabkit,.fabgallery"
						onChange={handleImport}
					/>
				</div>
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
