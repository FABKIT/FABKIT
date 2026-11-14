import { CanvasTexture } from "three";

const textures = new Map<string, CanvasTexture>();

/** A texture drawn once onto its own canvas and cached under `key`. If the 2D
 * context is unavailable it is simply blank rather than an error, since these
 * are all decorative. */
export function makeCanvasTexture(
	key: string,
	width: number,
	height: number,
	draw: (ctx: CanvasRenderingContext2D) => void,
): CanvasTexture {
	const cached = textures.get(key);
	if (cached) return cached;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (ctx) draw(ctx);
	const texture = new CanvasTexture(canvas);
	textures.set(key, texture);
	return texture;
}
