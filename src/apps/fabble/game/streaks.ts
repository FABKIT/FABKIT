import type { PersistedStreaks } from "@fabkit/apps/fabble/types";

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
