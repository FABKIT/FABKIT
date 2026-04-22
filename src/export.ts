/**
 * Card Export System
 *
 * Converts the live SVG card preview to a raster image using snapdom.
 * snapdom captures the DOM subtree with computed CSS applied, so the output
 * is pixel-accurate to what the user sees in the editor (WYSIWYG).
 *
 * ## How it works
 *
 * snapdom serialises the entire SVG element — including any `<foreignObject>`
 * elements containing Tiptap rich text — in a single pass through the browser's
 * own rendering pipeline. No multi-phase compositing is required.
 *
 * ## Scale Factor
 * The `scale` parameter controls output resolution:
 * - scale=1.0: Natural SVG size (~375x523px for standard cards)
 * - scale=2.0: 2x resolution for higher quality
 * - scale=0.4: Used for card thumbnails on save
 *
 * ## Meld Cards
 * Meld cards have a landscape SVG (628×450). When `rotatePortrait=true` the
 * exported image is rotated 90° CW so the final PNG is portrait (450×628),
 * matching the dimensions of a normal card export.
 */

import { type BlobType, snapdom } from "@zumer/snapdom";

/** Rotates an image Blob 90° CW or CCW via canvas. */
export async function rotateBlob(blob: Blob, degrees: -90 | 90): Promise<Blob> {
	const bitmap = await createImageBitmap(blob);
	const canvas = document.createElement("canvas");
	canvas.width = bitmap.height;
	canvas.height = bitmap.width;
	const ctx = canvas.getContext("2d");
	if (!ctx) return blob;
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate((degrees * Math.PI) / 180);
	ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
	return new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
			"image/png",
		),
	);
}

/**
 * Converts an SVG card element to a raster image Blob.
 *
 * @param svg - SVG element containing the card preview
 * @param scale - Output scale multiplier (default 1.0, use 2.0+ for high-quality export)
 * @param type - Image format (default "png")
 * @param rotatePortrait - Rotate 90° CW before export (landscape meld cards → portrait PNG)
 */
export async function convertToImage(
	svg: SVGSVGElement,
	scale = 1.0,
	type: BlobType = "png",
	rotatePortrait = false,
): Promise<Blob> {
	// Elements marked [data-export-hide] are UI affordances (e.g. the meld
	// active-half overlay) that must not appear in the exported image.
	const hidden = svg.querySelectorAll<SVGElement>("[data-export-hide]");
	const prev: string[] = [];
	hidden.forEach((el) => {
		prev.push(el.getAttribute("visibility") ?? "");
		el.setAttribute("visibility", "hidden");
	});

	let capture: Awaited<ReturnType<typeof snapdom>>;
	try {
		capture = await snapdom(svg, { scale, embedFonts: true });
	} finally {
		hidden.forEach((el, i) => {
			if (prev[i]) el.setAttribute("visibility", prev[i]);
			else el.removeAttribute("visibility");
		});
	}

	const blob = await capture.toBlob({ type });
	return rotatePortrait ? rotateBlob(blob, 90) : blob;
}
