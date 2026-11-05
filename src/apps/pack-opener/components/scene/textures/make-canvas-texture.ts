import { CanvasTexture } from "three";

/** A texture drawn once onto its own canvas. If the 2D context is unavailable it
 * is simply blank rather than an error, since these are all decorative. */
export function makeCanvasTexture(
	width: number,
	height: number,
	draw: (ctx: CanvasRenderingContext2D) => void,
): CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (ctx) draw(ctx);
	return new CanvasTexture(canvas);
}
