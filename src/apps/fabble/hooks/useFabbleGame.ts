import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GUESS_LIMITS } from "@fabkit/apps/fabble/lib/constants";
import type { Hint } from "@fabkit/apps/fabble/lib/hints";
import { generateHints, getAvailableHintCount } from "@fabkit/apps/fabble/lib/hints";
import type { Rotation } from "@fabkit/apps/fabble/lib/rotations";
import type {
	DailyCard,
	FabbleMode,
	GuessEntry,
	StreakData,
} from "@fabkit/apps/fabble/lib/types";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabbleStore";

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
	submitGuess: (name: string) => { gameOver: boolean };
	submitError: string | null;
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

	const guessLimit = GUESS_LIMITS[mode] ?? 8;
	const guessCount = guesses.length;
	const remainingGuesses = useMemo(
		() => Math.max(0, guessLimit - guessCount),
		[guessLimit, guessCount],
	);

	const hints = useMemo((): Hint[] => {
		if (daily) return generateHints(daily);
		return [];
	}, [daily]);

	const availableHintCount = useMemo(
		() => getAvailableHintCount(guessCount, mode),
		[guessCount, mode],
	);

	const submitGuess = useCallback(
		(name: string): { gameOver: boolean } => {
			const result = storeSubmitGuess(name);
			if (result.ok) {
				setSubmitError(null);
				return { gameOver: false };
			}
			switch (result.error) {
				case "unknown_card":
					setSubmitError(t("error.unknown_card"));
					break;
				case "already_guessed":
					setSubmitError(t("error.already_guessed"));
					break;
				case "game_over":
					setSubmitError(null);
					break;
				default:
					break;
			}
			return { gameOver: result.error === "game_over" };
		},
		[storeSubmitGuess, t],
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
		dismissFirstVisit,
		suppressGridAnimation,
		hints,
		availableHintCount,
		revealedHintCount,
		revealHint: storeRevealHint,
		activeRotation,
	};
}
