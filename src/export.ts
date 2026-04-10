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
 */

import { type BlobType, snapdom } from "@zumer/snapdom";

/**
 * Converts an SVG card element to a raster image Blob.
 *
 * @param svg - SVG element containing the card preview
 * @param scale - Output scale multiplier (default 1.0, use 2.0+ for high-quality export)
 * @param type - The image format to use when converting to an image.
 * @returns Promise resolving to an image Blob of the type `type`.
 */
export async function convertToImage(
	svg: SVGSVGElement,
	scale = 1.0,
	type: BlobType = "png",
): Promise<Blob> {
	const capture = await snapdom(svg, { scale, embedFonts: true });
	return await capture.toBlob({ type });
}
