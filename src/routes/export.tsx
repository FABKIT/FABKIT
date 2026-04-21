import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Renderer } from "../components/card-creator/Renderer.tsx";
import { convertToImage, rotateBlob } from "../export.ts";
import { useCardCreator } from "../stores/card-creator.ts";

export const Route = createFileRoute("/export")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const svgRef = useRef<SVGSVGElement>(null);
	const shouldReRender = useRef(true);
	const [portraitCard, setPortraitCard] = useState<Blob | null>(null);
	const [landscapeCard, setLandscapeCard] = useState<Blob | null>(null);
	const [isLandscape, setIsLandscape] = useState(false);
	const [isExporting, setIsExporting] = useState(true);
	const isMeldCard = useCardCreator((state) => state.CardType === "meld");

	const activeCard = isMeldCard && isLandscape ? landscapeCard : portraitCard;

	const imageUrl = useMemo(
		() => (activeCard ? URL.createObjectURL(activeCard) : null),
		[activeCard],
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
				const blob = await convertToImage(
					svgRef.current,
					1.0,
					"png",
					isMeldCard,
				);
				setPortraitCard(blob);
			} catch (error) {
				console.error("Failed to render card:", error);
			} finally {
				setIsExporting(false);
			}
		};

		// Give the Renderer time to mount and render
		setTimeout(renderCard, 100);
	}, [isMeldCard]);

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

	const toggleOrientation = async () => {
		if (!isMeldCard || !portraitCard) return;
		if (!isLandscape && !landscapeCard) {
			const lb = await rotateBlob(portraitCard, -90);
			setLandscapeCard(lb);
		}
		setIsLandscape((prev) => !prev);
	};

	return (
		<>
			{isExporting && (
				<div className="flex flex-1 flex-col justify-center items-center p-4 gap-4">
					{/* Most browsers won't render the images if they aren't on-screen, so we *have* to show the preview */}
					<Renderer ref={svgRef} isExport />
					<LoaderCircle className="animate-spin h-8 w-8 text-heading" />
					<span className="text-body">{t("export.exporting_label")}</span>
				</div>
			)}
			{!isExporting && activeCard && imageUrl && (
				<div className="flex flex-1 flex-col justify-center items-center p-4 gap-6">
					<img
						src={imageUrl}
						alt="Rendered card"
						className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
					/>
					<div className="flex items-center gap-3">
						{isMeldCard && (
							<button
								type="button"
								onClick={toggleOrientation}
								title={t(
									isLandscape
										? "export.rotate_portrait"
										: "export.rotate_landscape",
								)}
								className="flex items-center justify-center p-3 bg-surface-active text-heading rounded-md hover:opacity-90 transition-opacity"
							>
								<RotateCcw className="h-5 w-5" />
							</button>
						)}
						<button
							type="button"
							onClick={handleDownload}
							className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md hover:opacity-90 transition-opacity font-medium"
						>
							<Download className="h-5 w-5" />
							{t("export.download")}
						</button>
					</div>
				</div>
			)}
			{!isExporting && !activeCard && (
				<div className="flex flex-1 flex-col justify-center items-center p-4 gap-6">
					<span className="text-body">{t("export.exporting_error")}</span>
					<Link
						to="/card-creator"
						className="rounded-lg bg-surface-active px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
					>
						{t("export.try_again")}
					</Link>
				</div>
			)}
		</>
	);
}
