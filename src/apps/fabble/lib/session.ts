import type {
	FabbleMode,
	SessionData,
	SessionState,
	StreakData,
} from "./types";

// ─── Date arithmetic ──────────────────────────────────────────────────────────

/**
 * Returns a YYYY-MM-DD string offset by `offsetDays` from `date`.
 * Pure UTC date arithmetic.
 */
export function getDateOffset(date: string, offsetDays: number): string {
	const [year, month, day] = date.split("-").map(Number);
	const ms = Date.UTC(year, month - 1, day) + offsetDays * 86_400_000;
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
 * startedAt is set here (the store layer handles Date access; this is acceptable
 * since this function is only called from the store).
 */
export function buildFreshSession(
	mode: FabbleMode,
	date: string,
	poolVersion: string,
	startedAt?: string,
): SessionState {
	return {
		mode,
		date,
		poolVersion,
		daily: null,
		guesses: [],
		status: "in_progress",
		startedAt: startedAt ?? new Date().toISOString(),
		revealedHintCount: 0,
		workerHints: null,
	};
}

/**
 * Initializes or restores a game session for the given mode and date.
 * Reads from localStorage to check for an existing session.
 * On pool version mismatch: discards session guesses, preserves streak.
 */
export function initSession(
	mode: FabbleMode,
	date: string,
	poolVersion: string,
): SessionState {
	const stored = loadSession(mode, date);

	if (stored !== null) {
		// Pool version mismatch: discard session, preserve streak
		if (stored.poolVersion !== poolVersion) {
			console.warn(
				`[Fabble] Pool version mismatch for ${mode}:${date}. ` +
					`Session was ${stored.poolVersion}, current is ${poolVersion}. ` +
					`Session invalidated; streak preserved.`,
			);
			return buildFreshSession(mode, date, poolVersion);
		}

		// Valid stored session: restore daily and workerHints from the Worker's reveal payload
		return {
			mode,
			date,
			poolVersion: stored.poolVersion,
			daily: stored.reveal ?? null,
			guesses: stored.guesses,
			status: stored.status,
			startedAt: stored.startedAt,
			revealedHintCount: stored.revealedHintCount ?? 0,
			workerHints: stored.workerHints ?? null,
		};
	}

	return buildFreshSession(mode, date, poolVersion);
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
