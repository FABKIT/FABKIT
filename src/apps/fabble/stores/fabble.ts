import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { FabbleMode } from "../config";
import { MAX_GUESSES } from "../config";
import { compareCards } from "../game/compare";
import { type DailyPuzzle, getDailyPuzzle } from "../game/daily";
import { getToday } from "../game/date";
import type { SearchEntry } from "../game/search";
import { buildSearchIndex } from "../game/search";
import type { FabbleCard, FabbleDataset, GuessResult } from "../types";

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
	lastTwinMessage: string | null;
}

interface FabbleActions {
	ingestDataset(dataset: FabbleDataset): void;
	startOrRestoreSession(mode: FabbleMode): void;
	submitGuess(mode: FabbleMode, cardId: string): void;
	markGuessAnimated(mode: FabbleMode, guessId: string): void;
}

const initialState: FabbleState = {
	dataset: null,
	cardsById: null,
	searchIndex: null,
	sessions: {},
	lastTwinMessage: null,
};

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
			const { dataset } = get();
			if (!dataset) return;

			const puzzle = getDailyPuzzle(mode, dataset, getToday());
			if (!puzzle) return;

			const session: ModeSession = {
				date: dataset.generatedAt,
				answerId: puzzle.answerId,
				datasetVersion: dataset.datasetVersion,
				theme: puzzle.theme,
				guesses: [],
				twinGuesses: [],
				hintsRevealed: [false, false],
				status: "playing",
				animatedGuessIds: [],
			};

			set(
				(state) => ({ sessions: { ...state.sessions, [mode]: session } }),
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
						return {
							sessions: {
								...state.sessions,
								[mode]: {
									...current,
									twinGuesses: [...current.twinGuesses, result],
								},
							},
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

					return {
						sessions: {
							...state.sessions,
							[mode]: { ...current, guesses, status },
						},
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
	})),
);
