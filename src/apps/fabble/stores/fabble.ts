import type { FabbleMode } from "@fabkit/apps/fabble/config";
import {
	HINT_UNLOCK_GUESSES,
	MAX_GUESSES,
	USERNAME_MAX_LENGTH,
} from "@fabkit/apps/fabble/config";
import { compareCards } from "@fabkit/apps/fabble/game/compare";
import {
	type DailyPuzzle,
	getDailyPuzzle,
} from "@fabkit/apps/fabble/game/daily";
import {
	dayBefore,
	getToday,
	localDateKey,
} from "@fabkit/apps/fabble/game/date";
import { pickEndlessCard } from "@fabkit/apps/fabble/game/endless";
import type { SearchEntry } from "@fabkit/apps/fabble/game/search";
import { buildSearchIndex } from "@fabkit/apps/fabble/game/search";
import { STORAGE_KEYS, safeStorage } from "@fabkit/apps/fabble/game/storage";
import {
	applyResult,
	recordEndlessWin,
	resetEndlessStreak,
} from "@fabkit/apps/fabble/game/streaks";
import type {
	FabbleCard,
	FabbleDataset,
	GuessResult,
	PersistedEndlessSession,
	PersistedEndlessStreak,
	PersistedSession,
	PersistedStreaks,
} from "@fabkit/apps/fabble/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ModeSession {
	date: string;
	answerId: string;
	datasetVersion: string;
	theme: DailyPuzzle["theme"];
	guesses: GuessResult[];
	twinGuesses: GuessResult[];
	/** All guess ids (spent + twin), oldest first — real submission order. */
	order: string[];
	hintsRevealed: [boolean, boolean];
	status: "playing" | "won" | "lost";
	animatedGuessIds: string[];
}

/** Endless's current in-progress puzzle, runtime-shaped (guesses computed to GuessResult[],
    same relationship PersistedSession has to ModeSession). No date, no guess cap, no theme.
    `animatedGuessIds` isn't persisted (same as ModeSession's) — on hydration every already-
    persisted guess is marked animated immediately so reload doesn't replay old flips; only
    guesses made after that during the live session animate. */
export interface EndlessSession {
	answerId: string;
	datasetVersion: string;
	guesses: GuessResult[];
	twinGuesses: GuessResult[];
	order: string[];
	status: "playing" | "won" | "gave_up";
	animatedGuessIds: string[];
}

/** Guess + twin results merged back into real submission order — the endless counterpart
    to getOrderedResults(). */
export function getOrderedEndlessResults(
	session: EndlessSession,
): GuessResult[] {
	const resultsById = new Map<string, GuessResult>([
		...session.guesses.map((g): [string, GuessResult] => [g.guessId, g]),
		...session.twinGuesses.map((g): [string, GuessResult] => [g.guessId, g]),
	]);
	return session.order
		.map((id) => resultsById.get(id))
		.filter((g): g is GuessResult => g !== undefined);
}

export interface FabbleState {
	dataset: FabbleDataset | null;
	cardsById: Map<string, FabbleCard> | null;
	searchIndex: SearchEntry[] | null;
	sessions: Partial<Record<FabbleMode, ModeSession>>;
	streaks: Partial<Record<FabbleMode, PersistedStreaks>>;
	dismissedThemeDate: Partial<Record<FabbleMode, string>>;
	endlessSession: EndlessSession | null;
	endlessStreak: PersistedEndlessStreak;
	username: string;
	hasSeenRules: boolean;
	hasSeenRainbowHint: boolean;
}

export interface FabbleActions {
	ingestDataset(dataset: FabbleDataset): void;
	startOrRestoreSession(mode: FabbleMode): void;
	submitGuess(mode: FabbleMode, cardId: string): void;
	revealHint(mode: FabbleMode, hintIndex: 0 | 1): void;
	dismissTheme(mode: FabbleMode, date: string): void;
	markGuessAnimated(mode: FabbleMode, guessId: string): void;
	advanceToNewDay(mode: FabbleMode): void;
	startOrRestoreEndless(): void;
	submitEndlessGuess(cardId: string): void;
	markEndlessGuessAnimated(guessId: string): void;
	giveUpEndless(): void;
	nextEndlessPuzzle(): void;
	setUsername(name: string): void;
	markRulesSeen(): void;
	markRainbowHintSeen(): void;
	devReset(mode: FabbleMode): void;
}

const emptyStreaks: PersistedStreaks = {
	schema: 1,
	current: 0,
	best: 0,
	lastResultDate: null,
	lastResult: null,
};

const emptyEndlessStreak: PersistedEndlessStreak = {
	schema: 1,
	current: 0,
	best: 0,
	completedLog: [],
};

const initialState: FabbleState = {
	dataset: null,
	cardsById: null,
	searchIndex: null,
	sessions: {},
	streaks: {},
	dismissedThemeDate: {},
	endlessSession: null,
	endlessStreak:
		safeStorage.get<PersistedEndlessStreak>(STORAGE_KEYS.endlessStreak) ??
		emptyEndlessStreak,
	username: safeStorage.get<string>(STORAGE_KEYS.username) ?? "",
	hasSeenRules: safeStorage.get<boolean>(STORAGE_KEYS.seenRules) ?? false,
	hasSeenRainbowHint:
		safeStorage.get<boolean>(STORAGE_KEYS.seenRainbowHint) ?? false,
};

function persistSession(mode: FabbleMode, session: ModeSession): void {
	const persisted: PersistedSession = {
		schema: 1,
		mode,
		date: session.date,
		answerId: session.answerId,
		datasetVersion: session.datasetVersion,
		theme: session.theme,
		guesses: session.guesses.map((g) => g.guessId),
		twinGuessIds: session.twinGuesses.map((g) => g.guessId),
		order: session.order,
		hintsRevealed: session.hintsRevealed,
		status: session.status,
	};
	safeStorage.set(STORAGE_KEYS.session(mode), persisted);
}

/** Guess + twin results merged back into their real submission order (oldest first). */
export function getOrderedResults(session: ModeSession): GuessResult[] {
	const resultsById = new Map<string, GuessResult>([
		...session.guesses.map((g): [string, GuessResult] => [g.guessId, g]),
		...session.twinGuesses.map((g): [string, GuessResult] => [g.guessId, g]),
	]);
	return session.order
		.map((id) => resultsById.get(id))
		.filter((g): g is GuessResult => g !== undefined);
}

function hydrateSession(
	persisted: PersistedSession,
	cardsById: Map<string, FabbleCard>,
): ModeSession | null {
	const answerCard = cardsById.get(persisted.answerId);
	if (!answerCard) return null;

	const toResults = (ids: string[]): GuessResult[] =>
		ids
			.map((id) => cardsById.get(id))
			.filter((c): c is FabbleCard => c !== undefined)
			.map((guessCard) => compareCards(guessCard, answerCard));

	const guesses = toResults(persisted.guesses);
	const twinGuesses = toResults(persisted.twinGuessIds);

	return {
		date: persisted.date,
		answerId: persisted.answerId,
		datasetVersion: persisted.datasetVersion,
		theme: persisted.theme,
		guesses,
		twinGuesses,
		order: persisted.order,
		hintsRevealed: persisted.hintsRevealed,
		status: persisted.status,
		animatedGuessIds: [...guesses, ...twinGuesses].map((g) => g.guessId),
	};
}

function persistEndlessSession(session: EndlessSession): void {
	const persisted: PersistedEndlessSession = {
		schema: 1,
		answerId: session.answerId,
		datasetVersion: session.datasetVersion,
		guesses: session.guesses.map((g) => g.guessId),
		twinGuessIds: session.twinGuesses.map((g) => g.guessId),
		order: session.order,
		status: session.status,
	};
	safeStorage.set(STORAGE_KEYS.endlessSession, persisted);
}

function hydrateEndlessSession(
	persisted: PersistedEndlessSession,
	cardsById: Map<string, FabbleCard>,
): EndlessSession | null {
	const answerCard = cardsById.get(persisted.answerId);
	if (!answerCard) return null;

	const toResults = (ids: string[]): GuessResult[] =>
		ids
			.map((id) => cardsById.get(id))
			.filter((c): c is FabbleCard => c !== undefined)
			.map((guessCard) => compareCards(guessCard, answerCard));

	const guesses = toResults(persisted.guesses);
	const twinGuesses = toResults(persisted.twinGuessIds);

	return {
		answerId: persisted.answerId,
		datasetVersion: persisted.datasetVersion,
		guesses,
		twinGuesses,
		order: persisted.order,
		status: persisted.status,
		animatedGuessIds: [...guesses, ...twinGuesses].map((g) => g.guessId),
	};
}

function freshEndlessSession(
	dataset: FabbleDataset,
	excludeIds: string[],
): EndlessSession {
	const card = pickEndlessCard(dataset.cards, excludeIds);
	return {
		answerId: card.id,
		datasetVersion: dataset.datasetVersion,
		guesses: [],
		twinGuesses: [],
		order: [],
		status: "playing",
		animatedGuessIds: [],
	};
}

export const useFabbleStore = create<FabbleState & FabbleActions>()(
	devtools((set, get) => ({
		...initialState,

		ingestDataset: (dataset) => {
			if (get().dataset?.datasetVersion === dataset.datasetVersion) return;
			set(
				{
					dataset,
					cardsById: new Map(dataset.cards.map((c) => [c.id, c])),
					searchIndex: buildSearchIndex(dataset.cards),
				},
				undefined,
				"fabble/ingestDataset",
			);
		},

		startOrRestoreSession: (mode) => {
			const { dataset, cardsById } = get();
			if (!dataset || !cardsById) return;

			const todayKey = localDateKey(getToday());
			const persisted = safeStorage.get<PersistedSession>(
				STORAGE_KEYS.session(mode),
			);

			let session: ModeSession | null = null;
			if (persisted?.schema === 1 && persisted.date === todayKey) {
				session = hydrateSession(persisted, cardsById);
				if (!session)
					console.warn(`Fabble: discarding stale session for ${mode}`);
			}

			if (!session) {
				const puzzle = getDailyPuzzle(mode, dataset, getToday());
				if (!puzzle) return;

				session = {
					date: todayKey,
					answerId: puzzle.answerId,
					datasetVersion: dataset.datasetVersion,
					theme: puzzle.theme,
					guesses: [],
					twinGuesses: [],
					order: [],
					hintsRevealed: [false, false],
					status: "playing",
					animatedGuessIds: [],
				};
				persistSession(mode, session);
			}

			const streaks =
				safeStorage.get<PersistedStreaks>(STORAGE_KEYS.streaks(mode)) ??
				emptyStreaks;
			const dismissedTheme = safeStorage.get<{ date: string }>(
				STORAGE_KEYS.dismissedTheme(mode),
			);

			set(
				(state) => ({
					sessions: { ...state.sessions, [mode]: session },
					streaks: { ...state.streaks, [mode]: streaks },
					dismissedThemeDate: dismissedTheme
						? { ...state.dismissedThemeDate, [mode]: dismissedTheme.date }
						: state.dismissedThemeDate,
				}),
				undefined,
				"fabble/startOrRestoreSession",
			);
		},

		submitGuess: (mode, cardId) => {
			const { dataset, cardsById, sessions } = get();
			const session = sessions[mode];
			if (!dataset || !cardsById || !session || session.status !== "playing")
				return;
			if (
				session.guesses.some((g) => g.guessId === cardId) ||
				session.twinGuesses.some((g) => g.guessId === cardId)
			) {
				return;
			}

			const guessCard = cardsById.get(cardId);
			const answerCard = cardsById.get(session.answerId);
			if (!guessCard || !answerCard) return;

			const result = compareCards(guessCard, answerCard);

			set(
				(state) => {
					const current = state.sessions[mode];
					if (!current) return state;

					const order = [...current.order, cardId];

					if (result.isTwin) {
						const next: ModeSession = {
							...current,
							twinGuesses: [...current.twinGuesses, result],
							order,
						};
						persistSession(mode, next);
						return { sessions: { ...state.sessions, [mode]: next } };
					}

					const guesses = [...current.guesses, result];
					let status = current.status;
					if (result.correct) {
						status = "won";
					} else if (guesses.length >= MAX_GUESSES[mode]) {
						status = "lost";
					}

					const next: ModeSession = { ...current, guesses, order, status };
					persistSession(mode, next);

					if (status === "playing") {
						return { sessions: { ...state.sessions, [mode]: next } };
					}

					const todayKey = current.date;
					const yesterdayKey = dayBefore(todayKey);
					const prevStreaks = state.streaks[mode] ?? emptyStreaks;
					const nextStreaks = applyResult(
						prevStreaks,
						status === "won" ? "won" : "lost",
						todayKey,
						yesterdayKey,
					);
					safeStorage.set(STORAGE_KEYS.streaks(mode), nextStreaks);

					return {
						sessions: { ...state.sessions, [mode]: next },
						streaks: { ...state.streaks, [mode]: nextStreaks },
					};
				},
				undefined,
				"fabble/submitGuess",
			);
		},

		revealHint: (mode, hintIndex) => {
			set(
				(state) => {
					const current = state.sessions[mode];
					if (!current) return state;
					if (current.hintsRevealed[hintIndex]) return state;
					if (current.guesses.length < HINT_UNLOCK_GUESSES[hintIndex])
						return state;

					const hintsRevealed = [...current.hintsRevealed] as [
						boolean,
						boolean,
					];
					hintsRevealed[hintIndex] = true;
					const next: ModeSession = { ...current, hintsRevealed };
					persistSession(mode, next);

					return { sessions: { ...state.sessions, [mode]: next } };
				},
				undefined,
				"fabble/revealHint",
			);
		},

		dismissTheme: (mode, date) => {
			safeStorage.set(STORAGE_KEYS.dismissedTheme(mode), { date });
			set(
				(state) => ({
					dismissedThemeDate: { ...state.dismissedThemeDate, [mode]: date },
				}),
				undefined,
				"fabble/dismissTheme",
			);
		},

		markGuessAnimated: (mode, guessId) => {
			set(
				(state) => {
					const current = state.sessions[mode];
					if (!current || current.animatedGuessIds.includes(guessId))
						return state;
					return {
						sessions: {
							...state.sessions,
							[mode]: {
								...current,
								animatedGuessIds: [...current.animatedGuessIds, guessId],
							},
						},
					};
				},
				undefined,
				"fabble/markGuessAnimated",
			);
		},

		advanceToNewDay: (mode) => {
			get().startOrRestoreSession(mode);
		},

		startOrRestoreEndless: () => {
			const { dataset, cardsById } = get();
			if (!dataset || !cardsById) return;

			const persisted = safeStorage.get<PersistedEndlessSession>(
				STORAGE_KEYS.endlessSession,
			);

			let session: EndlessSession | null = null;
			if (persisted?.schema === 1) {
				session = hydrateEndlessSession(persisted, cardsById);
				if (!session) console.warn("Fabble: discarding stale endless session");
			}

			if (!session) {
				const excludeIds = get().endlessStreak.completedLog.map(
					(entry) => entry.answerId,
				);
				session = freshEndlessSession(dataset, excludeIds);
				persistEndlessSession(session);
			}

			set(
				{ endlessSession: session },
				undefined,
				"fabble/startOrRestoreEndless",
			);
		},

		submitEndlessGuess: (cardId) => {
			const { dataset, cardsById, endlessSession } = get();
			if (
				!dataset ||
				!cardsById ||
				!endlessSession ||
				endlessSession.status !== "playing"
			)
				return;
			if (
				endlessSession.guesses.some((g) => g.guessId === cardId) ||
				endlessSession.twinGuesses.some((g) => g.guessId === cardId)
			) {
				return;
			}

			const guessCard = cardsById.get(cardId);
			const answerCard = cardsById.get(endlessSession.answerId);
			if (!guessCard || !answerCard) return;

			const result = compareCards(guessCard, answerCard);

			set(
				(state) => {
					const current = state.endlessSession;
					if (!current) return state;

					const order = [...current.order, cardId];

					if (result.isTwin) {
						const next: EndlessSession = {
							...current,
							twinGuesses: [...current.twinGuesses, result],
							order,
						};
						persistEndlessSession(next);
						return { endlessSession: next };
					}

					const guesses = [...current.guesses, result];
					const status = result.correct ? "won" : current.status;
					const next: EndlessSession = {
						...current,
						guesses,
						order,
						status,
					};
					persistEndlessSession(next);

					if (status !== "won") {
						return { endlessSession: next };
					}

					const nextStreak = recordEndlessWin(
						state.endlessStreak,
						current.answerId,
						guesses.length,
					);
					safeStorage.set(STORAGE_KEYS.endlessStreak, nextStreak);

					return { endlessSession: next, endlessStreak: nextStreak };
				},
				undefined,
				"fabble/submitEndlessGuess",
			);
		},

		markEndlessGuessAnimated: (guessId) => {
			set(
				(state) => {
					const current = state.endlessSession;
					if (!current || current.animatedGuessIds.includes(guessId))
						return state;
					return {
						endlessSession: {
							...current,
							animatedGuessIds: [...current.animatedGuessIds, guessId],
						},
					};
				},
				undefined,
				"fabble/markEndlessGuessAnimated",
			);
		},

		giveUpEndless: () => {
			set(
				(state) => {
					const current = state.endlessSession;
					if (!current || current.status !== "playing") return state;

					const next: EndlessSession = { ...current, status: "gave_up" };
					persistEndlessSession(next);

					const nextStreak = resetEndlessStreak(state.endlessStreak);
					safeStorage.set(STORAGE_KEYS.endlessStreak, nextStreak);

					return { endlessSession: next, endlessStreak: nextStreak };
				},
				undefined,
				"fabble/giveUpEndless",
			);
		},

		nextEndlessPuzzle: () => {
			const { dataset, endlessStreak } = get();
			if (!dataset) return;

			const excludeIds = endlessStreak.completedLog.map(
				(entry) => entry.answerId,
			);
			const session = freshEndlessSession(dataset, excludeIds);
			persistEndlessSession(session);
			set({ endlessSession: session }, undefined, "fabble/nextEndlessPuzzle");
		},

		setUsername: (name) => {
			const trimmed = name.slice(0, USERNAME_MAX_LENGTH);
			safeStorage.set(STORAGE_KEYS.username, trimmed);
			set({ username: trimmed }, undefined, "fabble/setUsername");
		},

		markRulesSeen: () => {
			safeStorage.set(STORAGE_KEYS.seenRules, true);
			set({ hasSeenRules: true }, undefined, "fabble/markRulesSeen");
		},

		markRainbowHintSeen: () => {
			safeStorage.set(STORAGE_KEYS.seenRainbowHint, true);
			set(
				{ hasSeenRainbowHint: true },
				undefined,
				"fabble/markRainbowHintSeen",
			);
		},

		devReset: (mode) => {
			if (!import.meta.env.DEV) return;
			safeStorage.remove(STORAGE_KEYS.session(mode));
			safeStorage.remove(STORAGE_KEYS.streaks(mode));
			safeStorage.remove(STORAGE_KEYS.dismissedTheme(mode));
			set(
				(state) => {
					const sessions = { ...state.sessions };
					delete sessions[mode];
					const streaks = { ...state.streaks };
					delete streaks[mode];
					const dismissedThemeDate = { ...state.dismissedThemeDate };
					delete dismissedThemeDate[mode];
					return { sessions, streaks, dismissedThemeDate };
				},
				undefined,
				"fabble/devReset",
			);
		},
	})),
);
