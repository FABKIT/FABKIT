import { registerReportDataProvider } from "@fabkit/platform/bug-report";
import {
	AllRenderConfigVariations,
	type CardCreatorCardBack,
} from "./config/rendering.ts";
import type { FabgalleryCardEntry } from "./persistence/card-storage.ts";
import {
	exportCardToObject,
	getAllCards,
	getAllFolders,
} from "./persistence/card-storage.ts";
import type { CardCreatorState } from "./stores/card-creator.ts";
import { useCardCreator } from "./stores/card-creator.ts";

/**
 * Cards are serialized newest-first (getAllCards() order) and accumulated
 * until this budget is hit, then the rest are dropped with a `truncated`
 * marker rather than producing an unbounded download. Reports embed only
 * preview-resolution images (see exportCardToObject's includeFullResImages),
 * so this budget is about card COUNT at gallery scale, not per-image size.
 */
const MAX_REPORT_CARD_BYTES = 20 * 1024 * 1024;

function describeBlobForReport(
	blob: Blob | null | undefined,
): { byteSize: number; type: string } | null {
	return blob ? { byteSize: blob.size, type: blob.type } : null;
}

/**
 * Report-safe summary of a CardBack. Raw CardBack objects (and any future
 * Blob-valued fields on them, e.g. a custom frame's object URL) must never be
 * spread directly into a report — JSON.stringify silently turns a Blob into
 * `{}`, leaving a dead/misleading field with no indication anything was dropped.
 */
function describeCardBackForReport(cardBack: CardCreatorCardBack | null) {
	if (!cardBack) return null;
	const { id, name, type, dented, renderer, missing } = cardBack;
	// `missing` is surfaced deliberately, not incidentally — a report captured
	// while a card was showing the missing-frame placeholder should say so
	// loudly, not silently look like an ordinary custom frame.
	return { id, name, type, dented, renderer, missing };
}

registerReportDataProvider("card-creator", async () => {
	const state = useCardCreator.getState();
	const renderer =
		(state.CardBack as CardCreatorCardBack | null)?.renderer ?? null;

	// Raw Zustand state is never spread directly into the report — Blob-valued
	// fields (CardArtwork, CardOverlay, meld half artwork) would silently
	// collapse to `{}` under JSON.stringify, leaving a report field that looks
	// present but carries no useful information.
	const sanitisedState = {
		...state,
		CardBack: describeCardBackForReport(
			state.CardBack as CardCreatorCardBack | null,
		),
		CardBackRight: describeCardBackForReport(
			state.CardBackRight as CardCreatorCardBack | null,
		),
		CardArtwork: describeBlobForReport(state.CardArtwork),
		CardOverlay: describeBlobForReport(state.CardOverlay),
		meldHalfA: {
			...state.meldHalfA,
			CardArtwork: describeBlobForReport(state.meldHalfA?.CardArtwork),
		},
		meldHalfB: {
			...state.meldHalfB,
			CardArtwork: describeBlobForReport(state.meldHalfB?.CardArtwork),
		},
	} as unknown as CardCreatorState;

	const cards = await getAllCards().catch(() => []);
	const folders = await getAllFolders().catch(() => []);

	// Every card's images are embedded at preview resolution only
	// (includeFullResImages: false) — this is what keeps a report bounded even
	// before the size budget below kicks in; full-resolution artwork/overlay
	// are omitted, not just deferred. Cards are processed in the newest-first
	// order getAllCards() already returns, so once the budget is exceeded the
	// loop STOPS (not just skips) — the remaining cards are never even
	// exported, keeping report generation bounded in compute time, not just
	// output size, on a gallery with hundreds of cards.
	const serializedCards: FabgalleryCardEntry[] = [];
	let accumulatedBytes = 0;
	let processedCount = 0;
	for (const card of cards) {
		const exported = await exportCardToObject(card, {
			includeFullResImages: false,
		});
		// base64 preview length is a fine proxy for byte size for budgeting purposes.
		const approxBytes = exported.preview.length;
		if (accumulatedBytes + approxBytes > MAX_REPORT_CARD_BYTES) {
			break;
		}
		accumulatedBytes += approxBytes;
		serializedCards.push({ ...exported, folderId: card.folderId });
		processedCount++;
	}
	const omittedCards = cards.length - processedCount;

	return {
		state: sanitisedState as unknown as Record<string, unknown>,
		gallery: {
			format: "fabgallery",
			formatVersion: __APP_VERSION__,
			exportedAt: new Date().toISOString(),
			cardCount: serializedCards.length,
			cards: serializedCards,
			folders,
			...(omittedCards > 0
				? { truncated: { omittedCards, reason: "size-budget" as const } }
				: {}),
		},
		rendering: {
			cardBackRenderer: renderer,
			resolvedConfig: renderer
				? (AllRenderConfigVariations[renderer] ?? null)
				: null,
		},
	};
});
