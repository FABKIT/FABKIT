import { preloadRarityIcons } from "@fabkit/apps/pack-opener/cards/rarity-icon-cache";
import { PackOpenerPage } from "@fabkit/apps/pack-opener/components/PackOpenerPage";
import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import { preloadSafeTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture";
import { loadFabCardDataset } from "@fabkit/shared/data/fab-card-dataset";
import { loadSetIndex } from "@fabkit/shared/data/fab-printings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pack-opener")({
	loader: () =>
		Promise.all([
			preloadRarityIcons(),
			// Warms the card-back placeholder (see Card3D.tsx's CardBackFace)
			// well ahead of the first pack ever being opened, so a card
			// that's still loading its real art never has to wait on this
			// too. Fire-and-forget: preloadSafeTexture never rejects, it just
			// marks the URL failed internally and CardBackFace renders
			// nothing for that rare case.
			preloadSafeTexture(CARD_BACK_URL),
			// Errors are swallowed here, not left to fail the whole route load —
			// this is the cross-set fallback dataset (see card-resolver.ts's
			// fabDatasetCardResolver), used when a set's own per-set printing
			// data isn't available, itself falling back to mock cards per-draw
			// if this never loads either (offline, feed down, etc), so the app
			// should still work rather than blocking on this one fetch.
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
