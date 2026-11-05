import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";

interface GlowSpec {
	color: string;
	/** How much bigger than the card the glow grows at rest. This multiplies a
	 * plane already sized to the card, and stays close to 1 because the card
	 * fills most of the canvas: a much larger glow is simply cropped by the
	 * canvas edges. */
	maxScale: number;
	maxOpacity: number;
}

interface SparkleSpec {
	count: number;
	size: number;
	speed: number;
	color: string;
	/** World-space box the particles live in, as [x, y, z]. Wide on purpose:
	 * the card fills most of the canvas vertically but only a fraction of it
	 * horizontally, so spreading sideways is what keeps the effect from being
	 * hidden behind the card. */
	area: [number, number, number];
}

export interface FireworksSpec {
	shells: number;
	perShell: number;
	color: string;
}

interface CelebrationSpec {
	glow: GlowSpec;
	/** Null for a plain foil: its shader and glow are its celebration, and a
	 * foil Common is not a rare pull. */
	sparkles: SparkleSpec | null;
	/** Legendary and up only, so those pulls read as a different kind of event
	 * rather than more of the same glitter. */
	fireworks: FireworksSpec | null;
}

/** Everything each celebration tier does, in one table. Each step up adds
 * particles, size and speed rather than swapping one look for another. See
 * cards/celebration-tier.ts for what earns which tier. */
export const CELEBRATION_BY_TIER: Record<CelebrationTier, CelebrationSpec> = {
	foil: {
		glow: { color: "#8ecbff", maxScale: 1.18, maxOpacity: 0.4 },
		sparkles: null,
		fireworks: null,
	},
	majestic: {
		glow: { color: "#d4af37", maxScale: 1.14, maxOpacity: 0.35 },
		sparkles: {
			count: 28,
			size: 3,
			speed: 0.3,
			color: "#d4af37",
			area: [3.0, 2.0, 0.7],
		},
		fireworks: null,
	},
	legendary: {
		glow: { color: "#e8b24d", maxScale: 1.26, maxOpacity: 0.55 },
		sparkles: {
			count: 62,
			size: 5,
			speed: 0.5,
			color: "#f0c26a",
			area: [3.6, 2.3, 0.9],
		},
		fireworks: { shells: 3, perShell: 22, color: "#ffd77a" },
	},
	chase: {
		// FABKIT's own Marvel accent, matching text-pack-marvel in the HUD.
		glow: { color: "#ff6fae", maxScale: 1.36, maxOpacity: 0.7 },
		sparkles: {
			count: 95,
			size: 6,
			speed: 0.7,
			color: "#ff8fc4",
			area: [4.0, 2.5, 1.0],
		},
		fireworks: { shells: 4, perShell: 26, color: "#ff9ed2" },
	},
};
