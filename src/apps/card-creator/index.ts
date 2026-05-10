import { registerReportDataProvider } from "@platform/bug-report";
import { AllRenderConfigVariations } from "./config/rendering";
import {
	exportCardToObject,
	type FabgalleryFile,
	getAllCards,
} from "./persistence/card-storage";
import { useCardCreator } from "./stores/card-creator";

registerReportDataProvider(async () => {
	const storeState = useCardCreator.getState();
	const gallery = await getAllCards().catch(() => []);
	const cards = await Promise.all(gallery.map(exportCardToObject));

	const serializedGallery: FabgalleryFile = {
		format: "fabgallery",
		formatVersion: __APP_VERSION__,
		exportedAt: new Date().toISOString(),
		cardCount: cards.length,
		cards,
	};

	return {
		rendering: {
			cardBackRenderer: storeState.CardBack?.renderer ?? null,
			resolvedConfig: storeState.CardBack
				? (AllRenderConfigVariations[storeState.CardBack.renderer] ?? null)
				: null,
		},
		store: storeState,
		gallery: serializedGallery,
	};
});
