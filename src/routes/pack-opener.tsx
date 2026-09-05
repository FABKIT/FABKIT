import { preloadRarityIcons } from "@fabkit/apps/pack-opener/cards/rarity-icon-cache";
import { PackOpenerPage } from "@fabkit/apps/pack-opener/components/PackOpenerPage";
import { loadFabCardDataset } from "@fabkit/shared/data/fab-card-dataset";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pack-opener")({
	loader: () =>
		Promise.all([
			preloadRarityIcons(),
			// Errors are swallowed here, not left to fail the whole route load —
			// fabDatasetCardResolver falls back to mock cards per-draw if this
			// dataset never loads (offline, feed down, etc), so the app should
			// still work rather than blocking on this one fetch.
			loadFabCardDataset().catch((error) => {
				console.error("pack-opener: FAB card dataset failed to load", error);
			}),
		]),
	component: PackOpenerPage,
});
