import { createFileRoute } from "@tanstack/react-router";
import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Renderer } from "../components/card-creator/Renderer.tsx";
import { convertToImage } from "../export.ts";

export const Route = createFileRoute("/export")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const svgRef = useRef<SVGSVGElement>(null);
	const shouldReRender = useRef(true);
	const [exportedCard, setExportedCard] = useState<Blob | null>(null);
	const [isExporting, setIsExporting] = useState(true);

	const imageUrl = useMemo(
		() => (exportedCard ? URL.createObjectURL(exportedCard) : null),
		[exportedCard],
	);

	useEffect(() => {
		const renderCard = async () => {
			if (!svgRef.current) {
				console.error("SVG ref is not available");
				setIsExporting(false);
				return;
			}
			if (!shouldReRender.current) return;

			try {
				shouldReRender.current = false;
				await document.fonts.ready;
				const blob = await convertToImage(svgRef.current);
				setExportedCard(blob);
			} catch (error) {
				console.error("Failed to render card:", error);
			} finally {
				setIsExporting(false);
			}
		};

		// Give the Renderer time to mount and render
		setTimeout(renderCard, 100);
	}, []);

	// Cleanup blob URL when component unmounts
	useEffect(() => {
		return () => {
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}
		};
	}, [imageUrl]);

	const handleDownload = () => {
		if (!imageUrl) return;

		const link = document.createElement("a");
		link.href = imageUrl;
		link.download = "card.png";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<>
			{isExporting && (
				<div className="flex flex-1 flex-col justify-center items-center p-4 gap-4">
					{/* Most browsers won't render the images if they aren't on-screen, so we *have* to show the preview */}
					<Renderer ref={svgRef} />
					<LoaderCircle className="animate-spin h-8 w-8 text-heading" />
					<span className="text-body">{t("export.exporting_label")}</span>
				</div>
			)}
			{!isExporting && exportedCard && imageUrl && (
				<div className="flex flex-1 flex-col justify-center items-center p-4 gap-6">
					<img
						src={imageUrl}
						alt="Rendered card"
						className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
					/>
					<button
						type="button"
						onClick={handleDownload}
						className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md hover:opacity-90 transition-opacity font-medium"
					>
						<Download className="h-5 w-5" />
						{t("export.download")}
					</button>
				</div>
			)}
		</>
	);
}
