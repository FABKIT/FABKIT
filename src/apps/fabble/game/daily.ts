import type { FabbleMode } from "@fabkit/apps/fabble/config";
import { localDateKey } from "@fabkit/apps/fabble/game/date";
import type { FabbleDataset } from "@fabkit/apps/fabble/types";

export interface DailyPuzzle {
	answerId: string;
	theme: null | { kind: "equipment" } | { kind: "class"; className: string };
}

/** Look up today's entry in dataset.schedule[mode] by localDateKey(today).
    Returns null when the date is missing (stale dataset) — UI shows errors.no_puzzle. */
export function getDailyPuzzle(
	mode: FabbleMode,
	dataset: FabbleDataset,
	today: Date,
): DailyPuzzle | null {
	const todayKey = localDateKey(today);
	const entry = dataset.schedule[mode].find((e) => e.date === todayKey);
	if (!entry) return null;
	return { answerId: entry.cardId, theme: entry.theme ?? null };
}
