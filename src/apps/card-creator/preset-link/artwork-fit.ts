/**
 * Preset-Link Artwork Fit
 *
 * Decides where a preset link's fetched artwork sits on the card. The editor's
 * own upload field drops an image at its natural size against the card's
 * origin, which the person who picked it then drags into place. A preset link
 * has nobody to do that: the card opens on whatever the sender's image happened
 * to measure, so a small one hides in the top-left corner and a large one is
 * cropped from that corner outwards. This module places it instead.
 *
 * ─── What the artwork has to fill ─────────────────────────────────────────
 *
 * Not the clip rect. `artworkClip` is where artwork may be *drawn*; the frame's
 * border is painted over its outer band, so art drawn to the clip's edges is
 * partly hidden underneath and has to be scaled well past the visible area to
 * reach them. What art actually shows through is the frame image's aperture:
 * the transparent hole in the middle of the PNG. Nothing declares that hole, so
 * this module measures it — flood-fill the frame's alpha channel from a seed
 * inside the art area and take the filled region's bounding box.
 *
 * Covering that bounding box is both goals at once, not a compromise between
 * them: any box that leaves no visible gap must contain it, and the smallest
 * box that does is the bounding box itself, so covering it is the least
 * magnification that still fills the frame. It also needs no per-frame constant
 * — the measurement follows equipment, weapon, hero and token frames, and
 * user-uploaded ones, wherever their apertures happen to be.
 *
 * `preserveAspectRatio="xMidYMid slice"` on the renderer's `<image>` does the
 * rest: give it a box matching the artwork's own aspect ratio and it draws the
 * artwork at exactly that size, cropping nothing further.
 *
 * The geometry helpers are exported and unit-tested directly. The measurement
 * itself needs a canvas, so like `utils/frame-image.ts` it can only be
 * exercised in a real browser.
 */

import { AllRenderConfigVariations } from "../config/rendering.ts";
import type { CardCreatorState } from "../stores/card-creator.ts";

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface Size {
	width: number;
	height: number;
}

/** A pixel this transparent is a hole in the frame rather than faint artwork. */
const APERTURE_ALPHA_THRESHOLD = 16;

/** Measured apertures, keyed by frame image href. A frame's aperture can't
 * change without its image changing, and every card the session opens on the
 * same frame wants the same answer, so the decode happens once. */
const apertureCache = new Map<string, Rect | null>();

// ─── Geometry (pure, unit-tested) ─────────────────────────────────────────

/**
 * The box that draws `artwork` at the smallest size that still covers
 * `target`, centred on it. Returned in the same units as `target`.
 */
export function getCoverRect(target: Rect, artwork: Size): Rect {
	const scale = Math.max(
		target.width / artwork.width,
		target.height / artwork.height,
	);
	const width = artwork.width * scale;
	const height = artwork.height * scale;
	return {
		x: target.x + target.width / 2 - width / 2,
		y: target.y + target.height / 2 - height / 2,
		width,
		height,
	};
}

/** The smallest rect containing both — a hybrid card shows two frames, so the
 * artwork has to fill whichever parts of either are open. */
export function getUnionRect(a: Rect, b: Rect): Rect {
	const x = Math.min(a.x, b.x);
	const y = Math.min(a.y, b.y);
	return {
		x,
		y,
		width: Math.max(a.x + a.width, b.x + b.width) - x,
		height: Math.max(a.y + a.height, b.y + b.height) - y,
	};
}

/** Centre of a rect, in the rect's own units. */
function getCentre(rect: Rect): { x: number; y: number } {
	return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

// ─── Aperture measurement (needs a browser) ───────────────────────────────

function loadImage(href: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Couldn't load ${href}`));
		image.src = href;
	});
}

/**
 * Bounding box of the transparent region containing `seed`, in viewBox units.
 * `null` when the seed lands on frame rather than hole, or when the region
 * reaches the image's edge — a frame with no enclosed aperture (full-bleed
 * artwork) has no meaningful box to fit to, and its own transparent corners
 * would otherwise swallow the whole card.
 */
function getApertureFromImage(
	image: HTMLImageElement,
	viewBoxWidth: number,
	seed: { x: number; y: number },
): Rect | null {
	const width = image.naturalWidth;
	const height = image.naturalHeight;
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) return null;
	context.drawImage(image, 0, 0);

	// Tainted canvases throw here rather than returning anything readable.
	const { data } = context.getImageData(0, 0, width, height);
	const scale = width / viewBoxWidth;
	const seedX = Math.round(seed.x * scale);
	const seedY = Math.round(seed.y * scale);
	if (seedX < 0 || seedX >= width || seedY < 0 || seedY >= height) return null;

	const isHole = (index: number) =>
		data[index * 4 + 3] < APERTURE_ALPHA_THRESHOLD;
	const seedIndex = seedY * width + seedX;
	if (!isHole(seedIndex)) return null;

	const visited = new Uint8Array(width * height);
	const pending = [seedIndex];
	let minX = width;
	let maxX = 0;
	let minY = height;
	let maxY = 0;

	while (pending.length > 0) {
		const index = pending.pop() as number;
		if (visited[index]) continue;
		visited[index] = 1;
		if (!isHole(index)) continue;

		const x = index % width;
		const y = (index - x) / width;
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;

		if (x > 0) pending.push(index - 1);
		if (x < width - 1) pending.push(index + 1);
		if (y > 0) pending.push(index - width);
		if (y < height - 1) pending.push(index + width);
	}

	const isEnclosed =
		minX > 0 && minY > 0 && maxX < width - 1 && maxY < height - 1;
	if (!isEnclosed) return null;

	return {
		x: minX / scale,
		y: minY / scale,
		width: (maxX - minX + 1) / scale,
		height: (maxY - minY + 1) / scale,
	};
}

async function getFrameAperture(
	href: string | undefined,
	viewBoxWidth: number,
	seed: { x: number; y: number },
): Promise<Rect | null> {
	if (!href) return null;

	const cached = apertureCache.get(href);
	if (cached !== undefined) return cached;

	let aperture: Rect | null = null;
	try {
		aperture = getApertureFromImage(await loadImage(href), viewBoxWidth, seed);
	} catch (error) {
		console.error(
			`[preset-link] CardArtwork: couldn't measure the frame's artwork aperture from ${href}. Falling back to the frame's clip region.`,
			error,
		);
	}
	apertureCache.set(href, aperture);
	return aperture;
}

/**
 * Resolves the frame image the renderer draws for this pitch, matching
 * `resolveCardBackImage` in Renderer/NormalRenderer.tsx: a custom frame carries
 * a registry-owned `blob:` URL, a stock one a file name under `/cardbacks/`,
 * and a frame with neither is unusable rather than a broken href.
 */
function getFrameImageHref(
	cardBack: CardCreatorState["CardBack"],
	pitch: number | null,
): string | undefined {
	const image =
		cardBack?.images.find((entry) => entry.pitch === pitch) ??
		cardBack?.images[0];
	if (!image) return undefined;
	if (image.objectUrl) return image.objectUrl;
	return image.fileName ? `/cardbacks/${image.fileName}` : undefined;
}

// ─── Entry point ──────────────────────────────────────────────────────────

/**
 * Where a preset link's artwork should sit: the box that fills the frame's
 * open area at the smallest size that covers it. `null` when the card has no
 * render config to fit against, leaving the artwork wherever the store put it.
 *
 * Falls back to the config's clip region whenever an aperture can't be
 * measured (an unreadable frame image, a frame with no enclosed hole, or a
 * hybrid whose halves don't both measure). That never leaves a visible gap; it
 * just magnifies more than the aperture would.
 */
export async function getPresetArtworkRect(
	card: Pick<CardCreatorState, "CardBack" | "CardBackRight" | "CardPitch">,
	artwork: Size,
): Promise<Rect | null> {
	const config = AllRenderConfigVariations[card.CardBack?.renderer ?? ""];
	if (!config) return null;

	const clip = config.artworkClip ?? {
		x: 0,
		y: 0,
		width: config.viewBox.width,
		height: config.viewBox.height,
	};
	const seed = getCentre(config.artworkDragZone);
	const viewBoxWidth = config.viewBox.width;

	const left = await getFrameAperture(
		getFrameImageHref(card.CardBack, card.CardPitch),
		viewBoxWidth,
		seed,
	);
	let aperture = left;
	if (card.CardBackRight) {
		const right = await getFrameAperture(
			getFrameImageHref(card.CardBackRight, card.CardPitch),
			viewBoxWidth,
			seed,
		);
		aperture = left && right ? getUnionRect(left, right) : null;
	}

	return getCoverRect(aperture ?? clip, artwork);
}
