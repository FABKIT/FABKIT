import { create } from "zustand";
import { evaluateGuess } from "@fabkit/apps/fabble/lib/feedback";
import { GUESS_LIMITS } from "@fabkit/apps/fabble/lib/constants";
import type { Rotation } from "@fabkit/apps/fabble/lib/rotations";
import { getRotationForDate } from "@fabkit/apps/fabble/lib/rotations";
import {
	buildFreshSession,
	clearSession,
	completeSession,
	initSession,
	loadFirstVisit,
	loadStreak,
	markFirstVisitSeen,
	saveSession,
	saveStreak,
	updateRevealedHintCount,
} from "@fabkit/apps/fabble/lib/session";
import { selectDaily } from "@fabkit/apps/fabble/lib/selection";
import type {
	CanonicalCard,
	DailyCard,
	FabbleMode,
	GuessEntry,
	SessionData,
	StreakData,
	SubmitResult,
} from "@fabkit/apps/fabble/lib/types";

// ─── Store interface ──────────────────────────────────────────────────────────

interface FabbleStore {
	// Pools (loaded once per mode, stable after initMode)
	pool: CanonicalCard[] | null;       // search pool (autocomplete + guessing)
	dailyPool: CanonicalCard[] | null;  // daily selection pool (curated for Standard; same as pool for Chaos)
	poolVersion: string | null;

	// Active session
	mode: FabbleMode | null;
	date: string | null;
	daily: DailyCard | null;
	guesses: GuessEntry[];
	status: "idle" | "in_progress" | "won" | "lost";
	startedAt: string | null;

	// Persistence state
	streak: StreakData;
	firstVisitPending: boolean;
	suppressGridAnimation: boolean;

	// Hints + rotation
	revealedHintCount: number;
	activeRotation: Rotation | null;

	// Actions
	initMode(mode: FabbleMode, searchPool: CanonicalCard[], dailyPool: CanonicalCard[], poolVersion: string): void;
	resetSession(mode: FabbleMode): void;
	submitGuess(name: string): SubmitResult;
	revealHint(): void;
	dismissFirstVisit(): void;
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function getTodayUTC(): string {
	return new Date().toISOString().slice(0, 10);
}

// ─── Default streak ───────────────────────────────────────────────────────────

const DEFAULT_STREAK: StreakData = {
	current: 0,
	max: 0,
	lastSolvedDate: "",
};

// ─── Store implementation ─────────────────────────────────────────────────────

export const useFabbleStore = create<FabbleStore>((set, get) => ({
	// Initial state
	pool: null,
	dailyPool: null,
	poolVersion: null,
	mode: null,
	date: null,
	daily: null,
	guesses: [],
	status: "idle",
	startedAt: null,
	streak: DEFAULT_STREAK,
	firstVisitPending: false,
	suppressGridAnimation: false,
	revealedHintCount: 0,
	activeRotation: null,

	// ─── initMode ──────────────────────────────────────────────────────────────
	initMode: (mode, searchPool, dailyPool, poolVersion) => {
		const { mode: currentMode, poolVersion: currentVersion, pool: currentPool, status: currentStatus } = get();

		// Idempotent: no-op if same mode and pool version are already loaded
		if (
			currentMode === mode &&
			currentVersion === poolVersion &&
			currentPool !== null &&
			currentStatus !== "idle"
		) {
			return;
		}

		const today = getTodayUTC();
		const freshDaily = selectDaily(dailyPool, today, mode);
		const sessionState = initSession(mode, today, poolVersion, freshDaily);
		const streak = loadStreak(mode);
		const firstVisitSeen = loadFirstVisit();
		const isRestored = sessionState.guesses.length > 0;

		set({
			pool: searchPool,
			dailyPool,
			poolVersion,
			mode,
			date: today,
			daily: sessionState.daily,
			guesses: sessionState.guesses,
			status: sessionState.status,
			startedAt: sessionState.startedAt,
			streak,
			firstVisitPending: !firstVisitSeen,
			suppressGridAnimation: isRestored,
			revealedHintCount: sessionState.revealedHintCount,
			activeRotation: getRotationForDate(today),
		});
	},

	// ─── resetSession ──────────────────────────────────────────────────────────
	resetSession: (mode) => {
		const { poolVersion, dailyPool } = get();
		if (!poolVersion || !dailyPool) return;

		const today = getTodayUTC();
		clearSession(mode, today);

		const newDaily = selectDaily(dailyPool, today, mode);
		const sessionState = buildFreshSession(mode, today, poolVersion, newDaily);
		const streak = loadStreak(mode);

		set({
			date: today,
			daily: newDaily,
			guesses: sessionState.guesses,
			status: sessionState.status,
			startedAt: sessionState.startedAt,
			streak,
			suppressGridAnimation: false,
			revealedHintCount: 0,
			activeRotation: getRotationForDate(today),
		});
	},

	// ─── submitGuess ───────────────────────────────────────────────────────────
	submitGuess: (name) => {
		const { mode, poolVersion, pool, daily, status, guesses, revealedHintCount, startedAt, streak } = get();

		if (!mode || !poolVersion || !pool || !daily || status !== "in_progress") {
			return { ok: false, error: "game_over" };
		}

		const alreadyGuessed = guesses.some(
			(g) => g.name.toLowerCase() === name.toLowerCase(),
		);
		if (alreadyGuessed) return { ok: false, error: "already_guessed" };

		const guessedCard = pool.find(
			(c) => c.name.toLowerCase() === name.toLowerCase(),
		);
		if (!guessedCard) return { ok: false, error: "unknown_card" };

		const feedbackRow = evaluateGuess(guessedCard, daily);
		const correct = guessedCard.name === daily.name;

		const updatedGuesses: GuessEntry[] = [...guesses, { name: guessedCard.name, feedbackRow }];
		const guessLimit = GUESS_LIMITS[mode] ?? 8;
		const didExhaust = updatedGuesses.length >= guessLimit;
		const newStatus: SessionData["status"] = correct ? "won" : didExhaust ? "lost" : "in_progress";

		const today = getTodayUTC();
		const sessionToWrite: SessionData = {
			poolVersion,
			daily,
			guesses: updatedGuesses,
			status: newStatus,
			startedAt: startedAt ?? new Date().toISOString(),
			revealedHintCount,
		};
		saveSession(mode, today, sessionToWrite);

		let newStreak = streak;
		if (newStatus !== "in_progress") {
			newStreak = completeSession(sessionToWrite, streak, today);
			saveStreak(mode, newStreak);
		}

		set({
			guesses: updatedGuesses,
			status: newStatus,
			streak: newStreak,
			suppressGridAnimation: false,
		});

		return { ok: true };
	},

	// ─── revealHint ────────────────────────────────────────────────────────────
	revealHint: () => {
		const { mode, date, revealedHintCount } = get();
		if (!mode || !date) return;

		const newCount = revealedHintCount + 1;
		set({ revealedHintCount: newCount });
		updateRevealedHintCount(mode, date, newCount);
	},

	// ─── dismissFirstVisit ─────────────────────────────────────────────────────
	dismissFirstVisit: () => {
		markFirstVisitSeen();
		set({ firstVisitPending: false });
	},
}));
