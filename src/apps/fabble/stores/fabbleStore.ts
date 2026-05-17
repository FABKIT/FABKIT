import { create } from "zustand";
import { GUESS_LIMITS } from "../lib/constants";
import type { Rotation } from "../lib/rotations";
import { getRotationForDate } from "../lib/rotations";
import {
	buildFreshSession,
	completeSession,
	initSession,
	loadFirstVisit,
	loadStreak,
} from "../lib/session";
import type {
	CanonicalCard,
	DailyCard,
	FabbleMode,
	FeedbackRow,
	GuessEntry,
	SessionData,
	StreakData,
	SubmitResult,
} from "../lib/types";

// ─── Worker URL ───────────────────────────────────────────────────────────────

const GUESS_URL = (import.meta.env.VITE_GUESS_URL as string | undefined) ?? "";

// ─── Store interface ──────────────────────────────────────────────────────────

interface FabbleStore {
	// Pool data (loaded once per mode, stable after initMode)
	pool: CanonicalCard[] | null;
	poolVersion: string | null;

	// Active session
	mode: FabbleMode | null;
	date: string | null; // YYYY-MM-DD UTC; exposed so components don't recompute
	daily: DailyCard | null; // null during gameplay, set on Worker reveal
	guesses: GuessEntry[];
	status: "idle" | "in_progress" | "won" | "lost";
	startedAt: string | null; // ISO 8601; kept for future Rush mode

	// Persistence state
	streak: StreakData;
	firstVisitPending: boolean; // true if fabble:firstVisit not yet written
	suppressGridAnimation: boolean; // true if guesses came from localStorage (suppress flip animation)

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
		const current = get();

		// Idempotent: no-op if same mode and pool version are already loaded
		if (
			current.mode === mode &&
			current.poolVersion === poolVersion &&
			current.pool !== null &&
			current.status !== "idle"
		) {
			return;
		}

		const today = getTodayUTC();

		// Initialize or restore session
		const sessionState = initSession(mode, today, poolVersion);

		// Load streak and first-visit state
		const streak = loadStreak(mode);
		const firstVisitSeen = loadFirstVisit();

		// Determine if this is a restored session (has guesses from localStorage)
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
		const state = get();
		if (!state.poolVersion) return;

		const today = getTodayUTC();
		try {
			localStorage.removeItem(`fabble:session:${mode}:${today}`);
		} catch {
			// Storage failure is non-fatal
		}

		const sessionState = buildFreshSession(mode, today, state.poolVersion);
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
		const state = get();

		if (!state.mode || !state.poolVersion || state.status !== "in_progress") {
			return { ok: false, error: "game_over" };
		}

		// Local already-guessed check (avoids a round-trip for an obvious error)
		const alreadyGuessed = state.guesses.some(
			(g) => g.name.toLowerCase() === name.toLowerCase(),
		);
		if (alreadyGuessed) {
			return { ok: false, error: "already_guessed" };
		}

		const today = getTodayUTC();
		const guessLimit = GUESS_LIMITS[state.mode] ?? 8;
		const isLastGuess = state.guesses.length + 1 >= guessLimit;

		// Call Worker — unknown_card is signaled with HTTP 400 + { error: "unknown_card" }
		let workerResponse: {
			feedbackRow: FeedbackRow;
			correct: boolean;
			hints: { rarity: string; firstSet: string | null };
			reveal: DailyCard | null;
		};

		try {
			const res = await fetch(`${GUESS_URL}/fabble/guess`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mode: state.mode, guess: name, lastGuess: isLastGuess }),
			});

			if (res.status === 404) {
				const body = await res.json().catch(() => ({}));
				if ((body as { error?: string }).error === "unknown_card") {
					return { ok: false, error: "unknown_card" };
				}
			}

			if (!res.ok) {
				return { ok: false, error: "network_error" };
			}

			workerResponse = await res.json();
		} catch {
			return { ok: false, error: "network_error" };
		}

		const { feedbackRow, correct, hints, reveal } = workerResponse;

		// Determine new status
		const updatedGuesses: GuessEntry[] = [
			...state.guesses,
			{ name, feedbackRow },
		];
		const didExhaustGuesses = updatedGuesses.length >= guessLimit;
		const newStatus: SessionData["status"] = correct
			? "won"
			: didExhaustGuesses
				? "lost"
				: "in_progress";

		// Persist to localStorage
		const newDaily = reveal ?? state.daily;
		const newWorkerHints = hints ?? state.workerHints;

		const sessionToWrite: SessionData = {
			poolVersion: state.poolVersion,
			guesses: updatedGuesses,
			status: newStatus,
			startedAt: state.startedAt ?? new Date().toISOString(),
			revealedHintCount: state.revealedHintCount,
			reveal: reveal ?? undefined,
			workerHints: newWorkerHints ?? undefined,
		};
		safeLSWrite(`fabble:session:${state.mode}:${today}`, sessionToWrite);

		// Update streak on terminal status
		let newStreak = state.streak;
		if (newStatus !== "in_progress") {
			newStreak = completeSession(sessionToWrite, state.streak, today);
			safeLSWrite(`fabble:streak:${state.mode}`, newStreak);
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
		const state = get();
		if (!state.mode || !state.date || !state.poolVersion) return;

		const newCount = state.revealedHintCount + 1;
		set({ revealedHintCount: newCount });

		// Persist into the existing session blob
		const sessionKey = `fabble:session:${state.mode}:${state.date}`;
		try {
			const raw = localStorage.getItem(sessionKey);
			if (raw) {
				const session = JSON.parse(raw);
				localStorage.setItem(
					sessionKey,
					JSON.stringify({ ...session, revealedHintCount: newCount }),
				);
			}
		} catch {
			// Storage failure is non-fatal
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
