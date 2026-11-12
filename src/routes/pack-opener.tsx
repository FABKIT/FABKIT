import { PackOpenerLoading } from "@fabkit/apps/pack-opener/components/PackOpenerLoading";
import { PackOpenerPage } from "@fabkit/apps/pack-opener/components/PackOpenerPage";
import { PackOpenerUnavailable } from "@fabkit/apps/pack-opener/components/PackOpenerUnavailable";
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
		import("@fabkit/apps/pack-opener/lib/texture-cache")
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
	// Covers the wait for this app's own code and its set list, neither of
	// which is precached (see vite.config.ts). Shown only once the wait is
	// long enough to notice, so a warm cache never flashes it.
	pendingComponent: PackOpenerLoading,
	pendingMs: 200,
	// A first visit with no connection cannot download that code. This turns
	// it into a plain "needs a connection" screen and rethrows anything else
	// to the root error boundary.
	errorComponent: PackOpenerUnavailable,
	// Only the page itself is split out. The router would split the error
	// screen into its own chunk too by default, and a screen whose whole job
	// is to appear when chunks cannot be downloaded has to already be here.
	codeSplitGroupings: [["component"]],
});
