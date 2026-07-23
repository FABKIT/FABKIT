function pad2(n: number): string {
	return String(n).padStart(2, "0");
}

/** "2026-07-05" LOCAL, zero-padded — session stamp + schedule lookup key. */
export function localDateKey(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** "05-07-26" — share-card header (spec §7). */
export function shareDateLabel(d: Date): string {
	return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${pad2(d.getFullYear() % 100)}`;
}

export function msUntilLocalMidnight(now: Date): number {
	const midnight = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() + 1,
		0,
		0,
		0,
		0,
	);
	return midnight.getTime() - now.getTime();
}

/** "2026-07-05" → "2026-07-04" (for streak checks). */
export function dayBefore(dateKey: string): string {
	const [y, m, d] = dateKey.split("-").map(Number);
	const date = new Date(y, m - 1, d - 1);
	return localDateKey(date);
}

/** DEV ONLY: if import.meta.env.DEV and URL has ?fabbleDate=YYYY-MM-DD, return that date
    at noon local; else new Date(). ALL game-logic callers get "today" only through this. */
export function getToday(): Date {
	if (import.meta.env.DEV) {
		const override = new URLSearchParams(window.location.search).get(
			"fabbleDate",
		);
		if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
			const [y, m, d] = override.split("-").map(Number);
			return new Date(y, m - 1, d, 12, 0, 0, 0);
		}
	}
	return new Date();
}
