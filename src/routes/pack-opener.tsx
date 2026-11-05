import { PackOpenerPage } from "@fabkit/apps/pack-opener/components/PackOpenerPage";
import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { loadSetIndex } from "@fabkit/shared/data/fab-printings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pack-opener")({
	loader: () => {
		// Warms the card back ahead of the first pack, so a card still loading
		// its real art never has to wait on this too. Imported dynamically because
		// this loader stays in the entry chunk, and a static import of the texture
		// module would pull three.js in for every visitor to every page. Not
		// awaited: the card back is decoration, and CardFace copes with it
		// arriving late or never.
		import("@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture")
			.then(({ preloadSafeTexture }) => preloadSafeTexture(CARD_BACK_URL))
			.catch((error) => {
				console.error("pack-opener: card back failed to preload", error);
			});
		// public/data/pack-opener/index.json is gitignored build output (see
		// scripts/build-pack-data.ts): a dev who hasn't run
		// `bun run build-pack-data` yet, or a fetch failure in prod, must not
		// break the route. SetCarousel renders nothing when this never resolves.
		return loadSetIndex().catch((error) => {
			console.error("pack-opener: set index failed to load", error);
		});
	},
	component: PackOpenerPage,
});
