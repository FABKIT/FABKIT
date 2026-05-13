import { registerReportDataProvider } from "@fabkit/platform/bug-report";
import {
	AllRenderConfigVariations,
	type CardCreatorCardBack,
} from "./config/rendering.ts";
import { exportCardToObject, getAllCards } from "./persistence/card-storage.ts";
import { useCardCreator } from "./stores/card-creator.ts";

registerReportDataProvider("card-creator", async () => {
	const state = useCardCreator.getState();
	const renderer =
		(state.CardBack as CardCreatorCardBack | null)?.renderer ?? null;
	const cards = await getAllCards().catch(() => []);
	const serializedCards = await Promise.all(cards.map(exportCardToObject));

	return {
		state: state as unknown as Record<string, unknown>,
		gallery: {
			format: "fabgallery",
			formatVersion: __APP_VERSION__,
			exportedAt: new Date().toISOString(),
			cardCount: serializedCards.length,
			cards: serializedCards,
		},
		rendering: {
			cardBackRenderer: renderer,
			resolvedConfig: renderer
				? (AllRenderConfigVariations[renderer] ?? null)
				: null,
		},
	};
});
