import { CanvasTexture } from "three";

const TEXTURE_SIZE = 256;

let cachedTexture: CanvasTexture | null = null;

/**
 * A soft white radial gradient, opaque at the centre and fully transparent
 * at the edge, generated once and cached at module scope. There is only
 * ever one glow texture: every celebration tier tints it via its own
 * material `color` (see PullCelebration.tsx) rather than baking a colour
 * into the texture itself, so this never needs to be regenerated per tier.
 * Same canvas-drawn-texture idiom as cards/mock-card-texture.ts, just a
 * single gradient instead of a full card face.
 */
export function getGlowTexture(): CanvasTexture {
	if (cachedTexture) return cachedTexture;

	const canvas = document.createElement("canvas");
	canvas.width = TEXTURE_SIZE;
	canvas.height = TEXTURE_SIZE;
	const ctx = canvas.getContext("2d");
	if (ctx) {
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
	}

	cachedTexture = new CanvasTexture(canvas);
	cachedTexture.needsUpdate = true;
	return cachedTexture;
}
