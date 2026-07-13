import type { ColumnId, GuessResult } from "@fabkit/apps/fabble/types";

const RAINBOW_PARTIAL_COLUMNS: ReadonlySet<ColumnId> = new Set([
	"pitch",
	"cost",
	"power",
	"defense",
	"life",
]);

/** True when a guess has a partial (yellow) on a numeric or pitch column, the tell
    that the answer is a rainbow card with different stats per colour. Drives the
    one-time in-play hint (spec: rules.rainbow). */
export function hasRainbowPartial(result: GuessResult): boolean {
	return result.columns.some(
		(c) => RAINBOW_PARTIAL_COLUMNS.has(c.column) && c.state === "partial",
	);
}
