import type {
	MockCard,
	MockPitch,
} from "@fabkit/apps/pack-opener/cards/mock-card";
import { getRarityIcon } from "@fabkit/apps/pack-opener/cards/rarity-icon-cache";

/** Desaturated, ink-like pitch tones (not saturated RGB primaries) —
 * matches real FAB pitch border colors. Generic (no-pitch) cards get a
 * warm gold trim instead of grey, per FAB's frame convention. */
const PITCH_COLORS: Record<
	Exclude<MockPitch, null>,
	{ border: string; gem: string }
> = {
	red: { border: "#8b1e1e", gem: "#b22222" },
	yellow: { border: "#a3801f", gem: "#d4af37" },
	blue: { border: "#1f4e79", gem: "#274b7a" },
};
const GENERIC_GOLD = { border: "#8a6a2a", gem: "#d4af37" };
const PITCH_VALUE: Record<Exclude<MockPitch, null>, string> = {
	red: "1",
	yellow: "2",
	blue: "3",
};

const RARITY_TYPE_LABEL: Partial<Record<MockCard["rarity"], string>> = {
	basic: "Resource",
	token: "Token",
};

function drawRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, radius);
}

/** Traces a thin multi-hue gradient ring just inside the outer border —
 * the single most recognizable FAB visual signature on foil/Marvel cards. */
function drawRainbowEdge(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
) {
	const inset = 6;
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	const hues = [
		"#ff5f5f",
		"#ffd35f",
		"#7dff8a",
		"#5fd9ff",
		"#8a7dff",
		"#ff5fd3",
	];
	hues.forEach((hue, i) => {
		gradient.addColorStop(i / (hues.length - 1), hue);
	});
	ctx.strokeStyle = gradient;
	ctx.lineWidth = 4;
	drawRoundedRect(ctx, inset, inset, width - inset * 2, height - inset * 2, 14);
	ctx.stroke();
}

function drawPip(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	fill: string,
	label: string,
) {
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.fillStyle = fill;
	ctx.fill();
	ctx.strokeStyle = "rgba(255,255,255,0.6)";
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.fillStyle = "#ffffff";
	ctx.font = `bold ${Math.round(radius * 1.1)}px sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(label, cx, cy + 1);
}

/** Draws a placeholder card face onto a 2D canvas context, laid out like a
 * real FAB card frame (pitch/gold border, pitch gem + cost pip, name plate,
 * art window, type line, text box, rarity icon, power/defense pips, rainbow
 * foil edge on foil/Marvel cards). Not real FAB card art — the mock-data
 * stand-in until a real-data card resolver exists (see cards/card-resolver.ts). */
export function drawMockCardFace(
	ctx: CanvasRenderingContext2D,
	card: MockCard,
	width: number,
	height: number,
): void {
	const colors = card.pitch ? PITCH_COLORS[card.pitch] : GENERIC_GOLD;

	// Background / art window fills the whole card behind the frame elements.
	const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
	bgGradient.addColorStop(0, colors.gem);
	bgGradient.addColorStop(1, "#15151f");
	ctx.fillStyle = bgGradient;
	ctx.fillRect(0, 0, width, height);

	const artTop = height * 0.16;
	const artHeight = height * 0.46;
	const artGradient = ctx.createLinearGradient(
		0,
		artTop,
		0,
		artTop + artHeight,
	);
	artGradient.addColorStop(0, "rgba(0,0,0,0.15)");
	artGradient.addColorStop(1, "rgba(0,0,0,0.5)");
	ctx.fillStyle = artGradient;
	ctx.fillRect(width * 0.04, artTop, width * 0.92, artHeight);

	const icon = getRarityIcon(card.rarity);
	if (icon) {
		const iconSize = width * 0.16;
		ctx.globalAlpha = 0.85;
		ctx.drawImage(
			icon,
			width / 2 - iconSize / 2,
			artTop + artHeight / 2 - iconSize / 2,
			iconSize,
			iconSize,
		);
		ctx.globalAlpha = 1;
	}

	// Outer border/trim (pitch color or generic gold).
	const border = width * 0.032;
	ctx.strokeStyle = colors.border;
	ctx.lineWidth = border;
	drawRoundedRect(
		ctx,
		border / 2,
		border / 2,
		width - border,
		height - border,
		18,
	);
	ctx.stroke();

	if (card.foil || card.marvel) {
		drawRainbowEdge(ctx, width, height);
	}

	// Name plate.
	const nameplateY = height * 0.1;
	const nameplateH = height * 0.055;
	ctx.fillStyle = "rgba(10,10,16,0.72)";
	drawRoundedRect(ctx, width * 0.08, nameplateY, width * 0.84, nameplateH, 6);
	ctx.fill();
	ctx.fillStyle = "#ffffff";
	ctx.font = `bold ${Math.round(width * 0.052)}px sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(
		card.name,
		width / 2,
		nameplateY + nameplateH / 2 + 1,
		width * 0.78,
	);

	// Pitch gem (top-left) and cost pip (top-right).
	const pipRadius = width * 0.045;
	const pipY = height * 0.065;
	if (card.pitch) {
		drawPip(
			ctx,
			width * 0.11,
			pipY,
			pipRadius,
			colors.gem,
			PITCH_VALUE[card.pitch],
		);
	}
	drawPip(ctx, width * 0.89, pipY, pipRadius, "#1a1a24", String(card.cost));

	// Type line.
	const typeLineY = artTop + artHeight + height * 0.035;
	ctx.fillStyle = "rgba(255,255,255,0.85)";
	ctx.font = `${Math.round(width * 0.032)}px sans-serif`;
	ctx.textAlign = "center";
	ctx.fillText(
		RARITY_TYPE_LABEL[card.rarity] ?? "Action — Attack",
		width / 2,
		typeLineY,
	);

	// Text box — a few faint lines suggesting rules text.
	const textBoxTop = typeLineY + height * 0.03;
	const textBoxH = height * 0.14;
	ctx.fillStyle = "rgba(0,0,0,0.28)";
	drawRoundedRect(ctx, width * 0.08, textBoxTop, width * 0.84, textBoxH, 6);
	ctx.fill();
	ctx.strokeStyle = "rgba(255,255,255,0.25)";
	ctx.lineWidth = 2;
	for (let i = 0; i < 3; i++) {
		const lineY = textBoxTop + textBoxH * (0.28 + i * 0.28);
		ctx.beginPath();
		ctx.moveTo(width * 0.14, lineY);
		ctx.lineTo(width * (i === 2 ? 0.55 : 0.86), lineY);
		ctx.stroke();
	}

	// Power (bottom-left) / defense (bottom-right) pips.
	const statY = height * 0.925;
	drawPip(ctx, width * 0.12, statY, pipRadius, "#7a1f1f", String(card.power));
	drawPip(ctx, width * 0.88, statY, pipRadius, "#1f3d5c", String(card.defense));

	if (card.marvel) {
		ctx.font = `bold ${Math.round(width * 0.045)}px sans-serif`;
		ctx.fillStyle = colors.gem;
		ctx.textAlign = "center";
		ctx.fillText("MARVEL", width / 2, statY + pipRadius * 2.4);
	}

	// Collector/artist strip.
	ctx.fillStyle = "rgba(255,255,255,0.5)";
	ctx.font = `${Math.round(width * 0.022)}px sans-serif`;
	ctx.textAlign = "center";
	ctx.fillText(
		"FABKIT MOCK CARD — NOT REAL FAB DATA",
		width / 2,
		height * 0.958,
	);
}
