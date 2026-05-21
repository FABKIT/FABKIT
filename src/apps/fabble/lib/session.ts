import type {
	DailyCard,
	FabbleMode,
	SessionData,
	SessionState,
	StreakData,
} from "./types";

// ─── Safe localStorage helpers ───────────────────────────────────────────────

function safeLSWrite(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage failure is non-fatal
	}
}

function safeLSRemove(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {
		// Storage failure is non-fatal
	}
}

// ─── Session write helpers ────────────────────────────────────────────────────

export function saveSession(mode: FabbleMode, date: string, data: SessionData): void {
	safeLSWrite(`fabble:session:${mode}:${date}`, data);
}

export function clearSession(mode: FabbleMode, date: string): void {
	safeLSRemove(`fabble:session:${mode}:${date}`);
}

export function saveStreak(mode: FabbleMode, streak: StreakData): void {
	safeLSWrite(`fabble:streak:${mode}`, streak);
}

export function markFirstVisitSeen(): void {
	safeLSWrite("fabble:firstVisit", { seen: true, date: new Date().toISOString() });
}

// ─── Date arithmetic ──────────────────────────────────────────────────────────

/**
 * Returns a YYYY-MM-DD string offset by `offsetDays` from `date`.
 * Pure UTC date arithmetic.
 */
export function getDateOffset(date: string, offsetDays: number): string {
	const [year, month, day] = date.split("-").map(Number);
	const ms = Date.UTC(year as number, (month as number) - 1, day as number) + offsetDays * 86_400_000;
	return new Date(ms).toISOString().slice(0, 10);
}

// ─── Session persistence helpers ──────────────────────────────────────────────

/**
 * Reads session data from localStorage. Returns null on missing key or parse error.
 * This function accesses localStorage — call only from the store layer.
 */
export function loadSession(
	mode: FabbleMode,
	date: string,
): SessionData | null {
	try {
		const raw = localStorage.getItem(`fabble:session:${mode}:${date}`);
		return raw ? (JSON.parse(raw) as SessionData) : null;
	} catch {
		return null;
	}
}

/**
 * Reads streak data from localStorage. Returns a default streak if missing.
 * This function accesses localStorage — call only from the store layer.
 */
export function loadStreak(mode: FabbleMode): StreakData {
	try {
		const raw = localStorage.getItem(`fabble:streak:${mode}`);
		if (raw) return JSON.parse(raw) as StreakData;
	} catch {
		// Fall through to default
	}
	return { current: 0, max: 0, lastSolvedDate: "" };
}

/**
 * Reads firstVisit data from localStorage. Returns false if not seen.
 * This function accesses localStorage — call only from the store layer.
 */
export function loadFirstVisit(): boolean {
	try {
		const raw = localStorage.getItem("fabble:firstVisit");
		return raw !== null;
	} catch {
		return false;
	}
}

// ─── Session initialization ───────────────────────────────────────────────────

/**
 * Builds a fresh session — no localStorage read.
 * The daily card is passed in from the store (already computed by selectDaily).
 */
export function buildFreshSession(
	mode: FabbleMode,
	date: string,
	poolVersion: string,
	daily: DailyCard,
	startedAt?: string,
): SessionState {
	return {
		mode,
		date,
		poolVersion,
		daily,
		guesses: [],
		status: "in_progress",
		startedAt: startedAt ?? new Date().toISOString(),
		revealedHintCount: 0,
	};
}

/**
 * Initializes or restores a game session for the given mode and date.
 * Reads from localStorage to check for an existing session.
 *
 * Session continuity: if a stored session exists for today and includes the
 * daily card, that card is restored directly — independent of poolVersion.
 * This means a pool update pushed mid-day never disrupts an active player.
 * The new pool takes effect the following day when the date changes.
 */
export function initSession(
	mode: FabbleMode,
	date: string,
	poolVersion: string,
	daily: DailyCard,
): SessionState {
	const stored = loadSession(mode, date);

	if (stored !== null) {
		// Restore the stored daily card if present (session continuity guarantee).
		// If absent (sessions from before this version), fall back to the freshly
		// computed daily — same result for same date + pool.
		const restoredDaily = stored.daily ?? daily;

		return {
			mode,
			date,
			poolVersion,
			daily: restoredDaily,
			guesses: stored.guesses,
			status: stored.status,
			startedAt: stored.startedAt,
			revealedHintCount: stored.revealedHintCount ?? 0,
		};
	}

	return buildFreshSession(mode, date, poolVersion, daily);
}

// ─── Revealed hint count persistence ─────────────────────────────────────────

/**
 * Updates only the revealedHintCount in the stored session.
 * Call from the store after a hint is revealed.
 */
export function updateRevealedHintCount(
	mode: FabbleMode,
	date: string,
	count: number,
): void {
	try {
		const raw = localStorage.getItem(`fabble:session:${mode}:${date}`);
		if (!raw) return;
		const session = JSON.parse(raw) as SessionData;
		localStorage.setItem(
			`fabble:session:${mode}:${date}`,
			JSON.stringify({ ...session, revealedHintCount: count }),
		);
	} catch {
		// Silently ignore — hint count is non-critical
	}
}

// ─── Session completion ───────────────────────────────────────────────────────

/**
 * Called when a session transitions to "won" or "lost".
 * Pure function — returns updated streak; the store writes it to localStorage.
 */
export function completeSession(
	session: SessionData,
	streak: StreakData,
	today: string,
): StreakData {
	if (session.status === "won") {
		const yesterday = getDateOffset(today, -1);
		const isConsecutive = streak.lastSolvedDate === yesterday;
		const isAlreadyCounted = streak.lastSolvedDate === today;

		if (isAlreadyCounted) return streak; // no double-count on reload

		const newCurrent = isConsecutive ? streak.current + 1 : 1;
		return {
			current: newCurrent,
			max: Math.max(streak.max, newCurrent),
			lastSolvedDate: today,
		};
	}

	if (session.status === "lost") {
		// Streak resets on loss; lastSolvedDate not updated
		return { ...streak, current: 0 };
	}

	return streak;
}
