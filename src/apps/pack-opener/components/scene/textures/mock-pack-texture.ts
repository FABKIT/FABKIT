import { makeCanvasTexture } from "@fabkit/apps/pack-opener/components/scene/textures/make-canvas-texture";
import type { PackPart } from "@fabkit/apps/pack-opener/config/scene";
import type { CanvasTexture } from "three";

// Sized to the proportions of the meshes these are stretched onto (see
// config/scene.ts's PACK_WIDTH/PACK_HEIGHT/PACK_SEAL_HEIGHT), so the
// fallback pack isn't subtly squashed.
const BODY_WIDTH = 512;
const BODY_HEIGHT = 860;
const SEAL_WIDTH = 512;
const SEAL_HEIGHT = 115;

function drawPackBody(ctx: CanvasRenderingContext2D): void {
	const w = BODY_WIDTH;
	const h = BODY_HEIGHT;

	const bg = ctx.createLinearGradient(0, 0, w * 0.3, h);
	bg.addColorStop(0, "#3a2a5c");
	bg.addColorStop(0.45, "#1c2f4a");
	bg.addColorStop(1, "#0a0e18");
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, w, h);

	// Soft diagonal foil sheen streaks.
	ctx.globalAlpha = 0.12;
	ctx.fillStyle = "#ffffff";
	for (let i = 0; i < 4; i++) {
		ctx.save();
		ctx.translate(w * (0.15 + i * 0.28), 0);
		ctx.rotate((18 * Math.PI) / 180);
		ctx.fillRect(0, -h * 0.2, w * 0.05, h * 1.6);
		ctx.restore();
	}
	ctx.globalAlpha = 1;
}

function drawSealStrip(ctx: CanvasRenderingContext2D): void {
	const w = SEAL_WIDTH;
	const h = SEAL_HEIGHT;

	ctx.fillStyle = "#241c33";
	ctx.fillRect(0, 0, w, h);

	// Crimped/zigzag heat-seal edge along the bottom of the strip.
	const teeth = 26;
	const toothWidth = w / teeth;
	ctx.fillStyle = "#0a0e18";
	ctx.beginPath();
	ctx.moveTo(0, h);
	for (let i = 0; i <= teeth; i++) {
		const x = i * toothWidth;
		const y = i % 2 === 0 ? h * 0.78 : h * 0.9;
		ctx.lineTo(x, y);
	}
	ctx.lineTo(w, h);
	ctx.closePath();
	ctx.fill();
}

const textures: Partial<Record<PackPart, CanvasTexture>> = {};

/** The plain pack shown when a set has no art or its art failed to load: a
 * wrapper shape and sheen, with nothing on it to translate. Built once, since it
 * doesn't vary per pack. */
export function getMockPackTexture(part: PackPart): CanvasTexture {
	textures[part] ??=
		part === "body"
			? makeCanvasTexture(BODY_WIDTH, BODY_HEIGHT, drawPackBody)
			: makeCanvasTexture(SEAL_WIDTH, SEAL_HEIGHT, drawSealStrip);
	return textures[part];
}
