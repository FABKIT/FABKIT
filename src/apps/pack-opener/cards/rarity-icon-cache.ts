import {
	CardRarities,
	type CardRarity,
} from "@fabkit/shared/config/cards/rarities";

const iconImages = new Map<CardRarity, HTMLImageElement>();
let preloadPromise: Promise<void> | null = null;

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load rarity icon: ${url}`));
		img.src = url;
	});
}

/** Fetches every rarity icon once and caches the decoded images so
 * drawMockCardFace can blit them onto a canvas synchronously. Safe to call
 * more than once — subsequent calls reuse the same in-flight/settled promise.
 *
 * Uses a plain Image element rather than createImageBitmap: these SVGs only
 * declare a viewBox (no explicit width/height), and Chrome's
 * createImageBitmap throws InvalidStateError on such sourceless-size SVGs —
 * an <img> doesn't need intrinsic size since drawImage always specifies an
 * explicit destination size. */
export function preloadRarityIcons(): Promise<void> {
	if (!preloadPromise) {
		preloadPromise = Promise.all(
			(Object.keys(CardRarities) as CardRarity[]).map(async (rarity) => {
				const image = await loadImage(CardRarities[rarity].icon);
				iconImages.set(rarity, image);
			}),
		).then(() => undefined);
	}
	return preloadPromise;
}

export function getRarityIcon(
	rarity: CardRarity,
): HTMLImageElement | undefined {
	return iconImages.get(rarity);
}
