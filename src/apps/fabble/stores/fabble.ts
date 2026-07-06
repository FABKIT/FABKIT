import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { FabbleMode } from "../config";
import { MAX_GUESSES } from "../config";
import { compareCards } from "../game/compare";
import { type DailyPuzzle, getDailyPuzzle } from "../game/daily";
import { dayBefore, getToday, localDateKey } from "../game/date";
import type { SearchEntry } from "../game/search";
import { buildSearchIndex } from "../game/search";
import { STORAGE_KEYS, safeStorage } from "../game/storage";
import { applyResult } from "../game/streaks";
import type {
	FabbleCard,
	FabbleDataset,
	GuessResult,
	PersistedSession,
	PersistedStreaks,
} from "../types";

export interface ModeSession {
	date: string;
	answerId: string;
	datasetVersion: string;
	theme: DailyPuzzle["theme"];
	guesses: GuessResult[];
	twinGuesses: GuessResult[];
	hintsRevealed: [boolean, boolean];
	status: "playing" | "won" | "lost";
	animatedGuessIds: string[];
}

interface FabbleState {
	dataset: FabbleDataset | null;
	cardsById: Map<string, FabbleCard> | null;
	searchIndex: SearchEntry[] | null;
	sessions: Partial<Record<FabbleMode, ModeSession>>;
	streaks: Partial<Record<FabbleMode, PersistedStreaks>>;
	lastTwinMessage: string | null;
}

interface FabbleActions {
	ingestDataset(dataset: FabbleDataset): void;
	startOrRestoreSession(mode: FabbleMode): void;
	submitGuess(mode: FabbleMode, cardId: string): void;
	markGuessAnimated(mode: FabbleMode, guessId: string): void;
	devReset(mode: FabbleMode): void;
}

const initialState: FabbleState = {
	dataset: null,
	cardsById: null,
	searchIndex: null,
	sessions: {},
	streaks: {},
	lastTwinMessage: null,
};

const emptyStreaks: PersistedStreaks = {
	schema: 1,
	current: 0,
	best: 0,
	lastResultDate: null,
	lastResult: null,
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
		hintsRevealed: session.hintsRevealed,
		status: session.status,
	};
	safeStorage.set(STORAGE_KEYS.session(mode), persisted);
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
		hintsRevealed: persisted.hintsRevealed,
		status: persisted.status,
		animatedGuessIds: [...guesses, ...twinGuesses].map((g) => g.guessId),
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
					hintsRevealed: [false, false],
					status: "playing",
					animatedGuessIds: [],
				};
				persistSession(mode, session);
			}

			const streaks =
				safeStorage.get<PersistedStreaks>(STORAGE_KEYS.streaks(mode)) ??
				emptyStreaks;

			set(
				(state) => ({
					sessions: { ...state.sessions, [mode]: session },
					streaks: { ...state.streaks, [mode]: streaks },
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

					if (result.isTwin) {
						const next: ModeSession = {
							...current,
							twinGuesses: [...current.twinGuesses, result],
						};
						persistSession(mode, next);
						return {
							sessions: { ...state.sessions, [mode]: next },
							lastTwinMessage: guessCard.name,
						};
					}

					const guesses = [...current.guesses, result];
					let status = current.status;
					if (result.correct) {
						status = "won";
					} else if (guesses.length >= MAX_GUESSES[mode]) {
						status = "lost";
					}

					const next: ModeSession = { ...current, guesses, status };
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

		devReset: (mode) => {
			if (!import.meta.env.DEV) return;
			safeStorage.remove(STORAGE_KEYS.session(mode));
			safeStorage.remove(STORAGE_KEYS.streaks(mode));
			set(
				(state) => {
					const sessions = { ...state.sessions };
					delete sessions[mode];
					const streaks = { ...state.streaks };
					delete streaks[mode];
					return { sessions, streaks };
				},
				undefined,
				"fabble/devReset",
			);
		},
	})),
);
