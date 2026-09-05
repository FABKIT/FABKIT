import { useMemo } from "react";
import { CanvasTexture } from "three";

const BODY_WIDTH = 512;
const BODY_HEIGHT = 980;
const SEAL_WIDTH = 512;
const SEAL_HEIGHT = 140;

let bodyTexture: CanvasTexture | null = null;
let sealTexture: CanvasTexture | null = null;

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
	for (let i = 0; i < 4; i++) {
		ctx.fillStyle = "#ffffff";
		ctx.save();
		ctx.translate(w * (0.15 + i * 0.28), 0);
		ctx.rotate((18 * Math.PI) / 180);
		ctx.fillRect(0, -h * 0.2, w * 0.05, h * 1.6);
		ctx.restore();
	}
	ctx.globalAlpha = 1;

	// Wordmark lockup near the top.
	ctx.textAlign = "center";
	ctx.fillStyle = "#f3e6c8";
	ctx.font = `bold ${Math.round(w * 0.1)}px sans-serif`;
	ctx.fillText("FLESH AND BLOOD", w / 2, h * 0.09);
	ctx.font = `${Math.round(w * 0.032)}px sans-serif`;
	ctx.fillStyle = "rgba(243,230,200,0.8)";
	ctx.fillText("FABKIT MOCK BOOSTER PACK", w / 2, h * 0.12);

	// Abstract hero-silhouette placeholder, standing in for real key art.
	const centerX = w / 2;
	const shoulderY = h * 0.42;
	const glow = ctx.createRadialGradient(
		centerX,
		shoulderY,
		w * 0.05,
		centerX,
		shoulderY,
		w * 0.5,
	);
	glow.addColorStop(0, "rgba(140,110,255,0.35)");
	glow.addColorStop(1, "rgba(140,110,255,0)");
	ctx.fillStyle = glow;
	ctx.fillRect(0, h * 0.18, w, h * 0.55);

	ctx.fillStyle = "rgba(8,8,14,0.88)";
	ctx.beginPath();
	ctx.arc(centerX, shoulderY - w * 0.16, w * 0.11, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.moveTo(centerX - w * 0.22, h * 0.78);
	ctx.quadraticCurveTo(
		centerX - w * 0.28,
		shoulderY,
		centerX,
		shoulderY - w * 0.05,
	);
	ctx.quadraticCurveTo(
		centerX + w * 0.28,
		shoulderY,
		centerX + w * 0.22,
		h * 0.78,
	);
	ctx.closePath();
	ctx.fill();
	ctx.strokeStyle = "rgba(180,150,255,0.55)";
	ctx.lineWidth = 3;
	ctx.stroke();

	// Bottom foil vignette.
	const vignette = ctx.createLinearGradient(0, h * 0.85, 0, h);
	vignette.addColorStop(0, "rgba(0,0,0,0)");
	vignette.addColorStop(1, "rgba(0,0,0,0.55)");
	ctx.fillStyle = vignette;
	ctx.fillRect(0, h * 0.85, w, h * 0.15);
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

	ctx.textAlign = "center";
	ctx.fillStyle = "rgba(243,230,200,0.65)";
	ctx.font = `${Math.round(w * 0.028)}px sans-serif`;
	ctx.fillText("TEAR HERE", w / 2, h * 0.42);

	// Tear notch at the upper-right corner.
	ctx.fillStyle = "#f3e6c8";
	ctx.beginPath();
	ctx.moveTo(w * 0.94, 0);
	ctx.lineTo(w, 0);
	ctx.lineTo(w, h * 0.35);
	ctx.closePath();
	ctx.fill();
}

/** The pack's main body texture — chrome/foil pouch face with the wordmark
 * lockup and a placeholder hero silhouette. Static/singleton: the mock pack
 * design doesn't vary per pack, so this is built once and reused. */
export function usePackBodyTexture(): CanvasTexture {
	return useMemo(() => {
		if (!bodyTexture) {
			const canvas = document.createElement("canvas");
			canvas.width = BODY_WIDTH;
			canvas.height = BODY_HEIGHT;
			const ctx = canvas.getContext("2d");
			if (ctx) drawPackBody(ctx);
			bodyTexture = new CanvasTexture(canvas);
			bodyTexture.needsUpdate = true;
		}
		return bodyTexture;
	}, []);
}

/** The torn-off top seal strip's texture — crimped heat-seal edge + tear notch. */
export function usePackSealTexture(): CanvasTexture {
	return useMemo(() => {
		if (!sealTexture) {
			const canvas = document.createElement("canvas");
			canvas.width = SEAL_WIDTH;
			canvas.height = SEAL_HEIGHT;
			const ctx = canvas.getContext("2d");
			if (ctx) drawSealStrip(ctx);
			sealTexture = new CanvasTexture(canvas);
			sealTexture.needsUpdate = true;
		}
		return sealTexture;
	}, []);
}
