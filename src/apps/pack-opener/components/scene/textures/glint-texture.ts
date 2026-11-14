import { makeCanvasTexture } from "@fabkit/apps/pack-opener/components/scene/textures/make-canvas-texture";
import type { CanvasTexture } from "three";

const TEXTURE_SIZE = 128;

/** A white four-point flare: a long thin horizontal streak, a shorter vertical
 * one and a small hot core, the shape light makes coming off polished metal.
 * ColdFoilGlints tints it per treatment. */
export function getGlintTexture(): CanvasTexture {
	return makeCanvasTexture("glint", TEXTURE_SIZE, TEXTURE_SIZE, (ctx) => {
		const center = TEXTURE_SIZE / 2;

		// One soft disc squashed into a streak (or left round for the core).
		const flare = (scaleX: number, scaleY: number) => {
			ctx.save();
			ctx.translate(center, center);
			ctx.scale(scaleX, scaleY);
			const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, center);
			gradient.addColorStop(0, "rgba(255,255,255,1)");
			gradient.addColorStop(0.3, "rgba(255,255,255,0.4)");
			gradient.addColorStop(1, "rgba(255,255,255,0)");
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(0, 0, center, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		};

		ctx.globalCompositeOperation = "lighter";
		flare(1, 0.06);
		flare(0.06, 0.7);
		flare(0.2, 0.2);
	});
}
