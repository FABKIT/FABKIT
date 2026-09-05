import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { registerReportDataProvider } from "@fabkit/platform/bug-report";

registerReportDataProvider("pack-opener", () => {
	const { phase, revealIndex, pack, packsOpenedThisSession } =
		usePackOpenerStore.getState();

	return {
		state: {
			phase,
			revealIndex,
			packsOpenedThisSession,
			packSummary:
				pack?.map((card) => ({
					rarity: card.rarity,
					foil: card.foil,
					marvel: card.marvel,
				})) ?? null,
		},
	};
});
