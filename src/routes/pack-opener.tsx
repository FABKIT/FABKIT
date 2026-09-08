import { preloadRarityIcons } from "@fabkit/apps/pack-opener/cards/rarity-icon-cache";
import { PackOpenerPage } from "@fabkit/apps/pack-opener/components/PackOpenerPage";
import { loadFabCardDataset } from "@fabkit/shared/data/fab-card-dataset";
import { loadSetIndex } from "@fabkit/shared/data/fab-printings";
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
			// public/data/pack-opener/index.json is gitignored build output
			// (see scripts/build-pack-data.ts) — a dev who hasn't run
			// `bun run build-pack-data` yet, or a fetch failure in prod, must
			// not break the route. SetCarousel renders nothing when this
			// never resolves, same degrade-gracefully approach as the FAB
			// card dataset above.
			loadSetIndex().catch((error) => {
				console.error("pack-opener: set index failed to load", error);
			}),
		]),
	component: PackOpenerPage,
});
