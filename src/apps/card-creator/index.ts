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
import { useCardCreator } from "./stores/card-creator.ts";

registerReportDataProvider("card-creator", async () => {
	const state = useCardCreator.getState();
	const renderer =
		(state.CardBack as CardCreatorCardBack | null)?.renderer ?? null;
	const cards = await getAllCards().catch(() => []);
	const folders = await getAllFolders().catch(() => []);
	const serializedCards: FabgalleryCardEntry[] = await Promise.all(
		cards.map(async (card) => ({
			...(await exportCardToObject(card)),
			folderId: card.folderId,
		})),
	);

	return {
		state: state as unknown as Record<string, unknown>,
		gallery: {
			format: "fabgallery",
			formatVersion: __APP_VERSION__,
			exportedAt: new Date().toISOString(),
			cardCount: serializedCards.length,
			cards: serializedCards,
			folders,
		},
		rendering: {
			cardBackRenderer: renderer,
			resolvedConfig: renderer
				? (AllRenderConfigVariations[renderer] ?? null)
				: null,
		},
	};
});
