import { create } from "zustand";
import { GUESS_LIMITS } from "@fabkit/apps/fabble/lib/constants";
import type { Rotation } from "@fabkit/apps/fabble/lib/rotations";
import { getRotationForDate } from "@fabkit/apps/fabble/lib/rotations";
import {
	buildFreshSession,
	completeSession,
	initSession,
	loadFirstVisit,
	loadStreak,
} from "@fabkit/apps/fabble/lib/session";
import type {
	CanonicalCard,
	DailyCard,
	FabbleMode,
	GuessEntry,
	SessionData,
	StreakData,
	SubmitResult,
} from "@fabkit/apps/fabble/lib/types";
import { submitGuessToWorker } from "@fabkit/apps/fabble/lib/workerApi";

// ─── Store interface ──────────────────────────────────────────────────────────

interface FabbleStore {
	// Pool data (loaded once per mode, stable after initMode)
	pool: CanonicalCard[] | null;
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

	// Hints
	revealedHintCount: number;
	activeRotation: Rotation | null;
	workerHints: { rarity: string; firstSet: string | null } | null;

	// Actions
	initMode(mode: FabbleMode, pool: CanonicalCard[], poolVersion: string): void;
	resetSession(mode: FabbleMode): void;
	submitGuess(name: string): Promise<SubmitResult>;
	revealHint(): void;
	dismissFirstVisit(): void;
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function getTodayUTC(): string {
	return new Date().toISOString().slice(0, 10);
}

// ─── Safe localStorage write ──────────────────────────────────────────────────

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

function safeLSRead(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
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
	workerHints: null,

	// ─── initMode ──────────────────────────────────────────────────────────────
	initMode(mode: FabbleMode, pool: CanonicalCard[], poolVersion: string): void {
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

		const sessionState = initSession(mode, today, poolVersion);
		const streak = loadStreak(mode);
		const firstVisitSeen = loadFirstVisit();
		const isRestored = sessionState.guesses.length > 0;

		set({
			pool,
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
			workerHints: sessionState.workerHints,
		});
	},

	// ─── resetSession ──────────────────────────────────────────────────────────
	resetSession(mode: FabbleMode): void {
		const { poolVersion } = get();
		if (!poolVersion) return;

		const today = getTodayUTC();
		safeLSRemove(`fabble:session:${mode}:${today}`);

		const sessionState = buildFreshSession(mode, today, poolVersion);
		const streak = loadStreak(mode);

		set({
			date: today,
			daily: sessionState.daily,
			guesses: sessionState.guesses,
			status: sessionState.status,
			startedAt: sessionState.startedAt,
			streak,
			suppressGridAnimation: false,
			revealedHintCount: 0,
			activeRotation: getRotationForDate(today),
			workerHints: null,
		});
	},

	// ─── submitGuess ───────────────────────────────────────────────────────────
	async submitGuess(name: string): Promise<SubmitResult> {
		const { mode, poolVersion, status, guesses, revealedHintCount, startedAt, streak, workerHints, daily } = get();

		if (!mode || !poolVersion || status !== "in_progress") {
			return { ok: false, error: "game_over" };
		}

		const alreadyGuessed = guesses.some(
			(g) => g.name.toLowerCase() === name.toLowerCase(),
		);
		if (alreadyGuessed) {
			return { ok: false, error: "already_guessed" };
		}

		const today = getTodayUTC();
		const guessLimit = GUESS_LIMITS[mode] ?? 8;
		const isLastGuess = guesses.length + 1 >= guessLimit;

		const workerResult = await submitGuessToWorker(mode, name, isLastGuess);
		if (!workerResult.ok) {
			return { ok: false, error: workerResult.error };
		}

		const { feedbackRow, correct, hints, reveal } = workerResult.data;

		const updatedGuesses: GuessEntry[] = [...guesses, { name, feedbackRow }];
		const didExhaustGuesses = updatedGuesses.length >= guessLimit;
		const newStatus: SessionData["status"] = correct
			? "won"
			: didExhaustGuesses
				? "lost"
				: "in_progress";

		const newDaily = reveal ?? daily;
		const newWorkerHints = hints ?? workerHints;

		const sessionToWrite: SessionData = {
			poolVersion,
			guesses: updatedGuesses,
			status: newStatus,
			startedAt: startedAt ?? new Date().toISOString(),
			revealedHintCount,
			reveal: reveal ?? undefined,
			workerHints: newWorkerHints ?? undefined,
		};
		safeLSWrite(`fabble:session:${mode}:${today}`, sessionToWrite);

		let newStreak = streak;
		if (newStatus !== "in_progress") {
			newStreak = completeSession(sessionToWrite, streak, today);
			safeLSWrite(`fabble:streak:${mode}`, newStreak);
		}

		set({
			guesses: updatedGuesses,
			status: newStatus,
			streak: newStreak,
			suppressGridAnimation: false,
			daily: newDaily,
			workerHints: newWorkerHints,
		});

		return { ok: true };
	},

	// ─── revealHint ────────────────────────────────────────────────────────────
	revealHint(): void {
		const { mode, date, poolVersion, revealedHintCount } = get();
		if (!mode || !date || !poolVersion) return;

		const newCount = revealedHintCount + 1;
		set({ revealedHintCount: newCount });

		const sessionKey = `fabble:session:${mode}:${date}`;
		const raw = safeLSRead(sessionKey);
		if (raw) {
			try {
				const session = JSON.parse(raw);
				safeLSWrite(sessionKey, { ...session, revealedHintCount: newCount });
			} catch {
				// Corrupt session data — non-fatal
			}
		}
	},

	// ─── dismissFirstVisit ─────────────────────────────────────────────────────
	dismissFirstVisit(): void {
		safeLSWrite("fabble:firstVisit", {
			seen: true,
			date: new Date().toISOString(),
		});
		set({ firstVisitPending: false });
	},
}));
