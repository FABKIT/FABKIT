import type {
	PersistedEndlessStreak,
	PersistedStreaks,
} from "@fabkit/apps/fabble/types";

export function applyResult(
	prev: PersistedStreaks,
	result: "won" | "lost",
	todayKey: string,
	yesterdayKey: string,
): PersistedStreaks {
	if (prev.lastResultDate === todayKey) return prev;

	let current: number;
	if (result === "lost") {
		current = 0;
	} else {
		current =
			prev.lastResultDate === yesterdayKey && prev.lastResult === "won"
				? prev.current + 1
				: 1;
	}

	return {
		schema: 1,
		current,
		best: Math.max(prev.best, current),
		lastResultDate: todayKey,
		lastResult: result,
	};
}

/** Endless's streak is consecutive-within-session, not date-keyed like PersistedStreaks —
    a solve extends it, a give-up resets it (and clears the current streak's log). */
export function recordEndlessWin(
	prev: PersistedEndlessStreak,
	answerId: string,
	guessCount: number,
): PersistedEndlessStreak {
	const current = prev.current + 1;
	return {
		schema: 1,
		current,
		best: Math.max(prev.best, current),
		completedLog: [...prev.completedLog, { answerId, guessCount }],
	};
}

export function resetEndlessStreak(
	prev: PersistedEndlessStreak,
): PersistedEndlessStreak {
	return {
		schema: 1,
		current: 0,
		best: prev.best,
		completedLog: [],
	};
}
