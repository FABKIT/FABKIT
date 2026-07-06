import { registerReportDataProvider } from "@fabkit/platform/bug-report";
import { useFabbleStore } from "./stores/fabble";

registerReportDataProvider("fabble", () => {
	const { sessions, streaks, dataset } = useFabbleStore.getState();

	const redactedSessions = Object.fromEntries(
		Object.entries(sessions).map(([mode, session]) => [
			mode,
			session && { ...session, answerId: "hidden" },
		]),
	);

	return {
		state: {
			datasetVersion: dataset?.datasetVersion ?? null,
			sessions: redactedSessions,
			streaks,
		},
	};
});
