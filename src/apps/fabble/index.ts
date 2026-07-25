import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabble";
import { registerReportDataProvider } from "@fabkit/platform/bug-report";

registerReportDataProvider("fabble", () => {
	const { sessions, streaks, endlessSession, endlessStreak, dataset } =
		useFabbleStore.getState();

	const redactedSessions = Object.fromEntries(
		Object.entries(sessions).map(([mode, session]) => [
			mode,
			session && { ...session, answerId: "hidden" },
		]),
	);
	const redactedEndlessSession = endlessSession && {
		...endlessSession,
		answerId: "hidden",
	};

	return {
		state: {
			datasetVersion: dataset?.datasetVersion ?? null,
			sessions: redactedSessions,
			streaks,
			endlessSession: redactedEndlessSession,
			endlessStreak,
		},
	};
});
