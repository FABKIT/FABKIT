import { makeCanvasTexture } from "@fabkit/apps/pack-opener/components/scene/textures/make-canvas-texture";
import type { CanvasTexture } from "three";

const TEXTURE_SIZE = 256;

/**
 * A soft white radial gradient, opaque at the centre and fully transparent
 * at the edge. Every celebration tier tints it via its own material `color`.
 */
export function getGlowTexture(): CanvasTexture {
	return makeCanvasTexture("glow", TEXTURE_SIZE, TEXTURE_SIZE, (ctx) => {
		const center = TEXTURE_SIZE / 2;
		const gradient = ctx.createRadialGradient(
			center,
			center,
			0,
			center,
			center,
			center,
		);
		gradient.addColorStop(0, "rgba(255,255,255,1)");
		gradient.addColorStop(0.4, "rgba(255,255,255,0.55)");
		gradient.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
	});
}
