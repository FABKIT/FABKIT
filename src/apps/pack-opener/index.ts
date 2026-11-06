import { registerReportDataProvider } from "@fabkit/platform/bug-report";

// main.tsx imports this file on every page. Importing the store at the top
// would pull three.js into every visitor's first load, for a report that is
// rarely filed and usually from another app entirely.
registerReportDataProvider("pack-opener", async () => {
	try {
		const { usePackOpenerStore } = await import(
			"@fabkit/apps/pack-opener/stores/pack-opener"
		);
		const { phase, revealIndex, pack, openedPacksThisSession } =
			usePackOpenerStore.getState();

		return {
			state: {
				phase,
				revealIndex,
				packsOpenedThisSession: openedPacksThisSession.length,
				packSummary:
					pack?.map((card) => ({
						rarity: card.rarity,
						treatment: card.treatment,
					})) ?? null,
			},
		};
	} catch {
		// Offline or a stale deploy: one app's missing chunk must not cost a
		// report the player may be filing about another app entirely.
		return { state: { loaded: false } };
	}
});
