import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GUESS_LIMITS } from "../lib/constants";
import type { Hint } from "../lib/hints";
import { generateHints, getAvailableHintCount } from "../lib/hints";
import type { Rotation } from "../lib/rotations";
import type {
	DailyCard,
	FabbleMode,
	GuessEntry,
	StreakData,
} from "../lib/types";
import { useFabbleStore } from "../stores/fabbleStore";

// ─── Hook output shape ────────────────────────────────────────────────────────

export interface UseFabbleGameResult {
	daily: DailyCard | null;
	guesses: GuessEntry[];
	status: "idle" | "in_progress" | "won" | "lost";
	guessCount: number;
	guessLimit: number;
	remainingGuesses: number;
	streak: StreakData;
	firstVisitPending: boolean;
	submitGuess: (name: string) => void;
	submitError: string | null;
	isSubmitting: boolean;
	dismissFirstVisit: () => void;
	suppressGridAnimation: boolean;
	hints: Hint[];
	availableHintCount: number;
	revealedHintCount: number;
	revealHint: () => void;
	activeRotation: Rotation | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFabbleGame(mode: FabbleMode): UseFabbleGameResult {
	const { t } = useTranslation("fabble");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Individual selectors — never whole-store read
	const daily = useFabbleStore((s) => s.daily);
	const guesses = useFabbleStore((s) => s.guesses);
	const status = useFabbleStore((s) => s.status);
	const streak = useFabbleStore((s) => s.streak);
	const firstVisitPending = useFabbleStore((s) => s.firstVisitPending);
	const storeSubmitGuess = useFabbleStore((s) => s.submitGuess);
	const dismissFirstVisit = useFabbleStore((s) => s.dismissFirstVisit);
	const suppressGridAnimation = useFabbleStore((s) => s.suppressGridAnimation);
	const revealedHintCount = useFabbleStore((s) => s.revealedHintCount);
	const storeRevealHint = useFabbleStore((s) => s.revealHint);
	const activeRotation = useFabbleStore((s) => s.activeRotation);
	const workerHints = useFabbleStore((s) => s.workerHints);

	const guessLimit = GUESS_LIMITS[mode] ?? 8;
	const guessCount = guesses.length;
	const remainingGuesses = Math.max(0, guessLimit - guessCount);

	const hints = useMemo((): Hint[] => {
		if (workerHints) {
			return [
				{ id: "rarity", labelKey: "hint.label.rarity", value: workerHints.rarity ?? "—" },
				{ id: "set", labelKey: "hint.label.set", value: workerHints.firstSet ?? "—" },
			];
		}
		if (daily) return generateHints(daily);
		return [];
	}, [workerHints, daily]);

	const availableHintCount = useMemo(
		() => getAvailableHintCount(guessCount, mode),
		[guessCount, mode],
	);

	const submitGuess = useCallback(
		(name: string): void => {
			if (isSubmitting) return;
			setIsSubmitting(true);
			storeSubmitGuess(name)
				.then((result) => {
					if (result.ok) {
						setSubmitError(null);
					} else {
						switch (result.error) {
							case "unknown_card":
								setSubmitError(t("error.unknown_card"));
								break;
							case "already_guessed":
								setSubmitError(t("error.already_guessed"));
								break;
							case "network_error":
								setSubmitError(t("error.network_error"));
								break;
							case "game_over":
								setSubmitError(null);
								break;
						}
					}
				})
				.catch(() => setSubmitError(t("error.network_error")))
				.finally(() => setIsSubmitting(false));
		},
		[isSubmitting, storeSubmitGuess, t],
	);

	return {
		daily,
		guesses,
		status,
		guessCount,
		guessLimit,
		remainingGuesses,
		streak,
		firstVisitPending,
		submitGuess,
		submitError,
		isSubmitting,
		dismissFirstVisit,
		suppressGridAnimation,
		hints,
		availableHintCount,
		revealedHintCount,
		revealHint: storeRevealHint,
		activeRotation,
	};
}
