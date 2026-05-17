import { registerReportDataProvider } from "@fabkit/platform/bug-report";
import { useFabbleStore } from "./stores/fabbleStore";

registerReportDataProvider("fabble", () => {
	const state = useFabbleStore.getState();
	return {
		state: {
			mode: state.mode,
			date: state.date,
			status: state.status,
			guessCount: state.guesses?.length ?? 0,
			streak: state.streak,
		},
	};
});
