import { FabbleHeader } from "@fabkit/apps/fabble/components/FabbleHeader";
import { PostSolvePanel } from "@fabkit/apps/fabble/components/PostSolve/PostSolvePanel";
import { GuessGrid } from "@fabkit/apps/fabble/components/Puzzle/GuessGrid";
import { GuessInput } from "@fabkit/apps/fabble/components/Puzzle/GuessInput";
import { HintPanel } from "@fabkit/apps/fabble/components/Puzzle/HintPanel";
import { PuzzleToolbar } from "@fabkit/apps/fabble/components/Puzzle/PuzzleToolbar";
import { RulesModal } from "@fabkit/apps/fabble/components/Rules/RulesModal";
import { useFabbleGame } from "@fabkit/apps/fabble/hooks/useFabbleGame";
import { POST_SOLVE_DELAY_MS } from "@fabkit/apps/fabble/lib/constants";
import { buildChaosPool, buildStandardSearchPool } from "@fabkit/apps/fabble/lib/pool";
import {
	STANDARD_SELECTION,
	STANDARD_SELECTION_VERSION,
} from "@fabkit/apps/fabble/lib/standardSelection.generated";
import type { CanonicalCard, FabbleMode, RawCard } from "@fabkit/apps/fabble/lib/types";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabbleStore";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// ─── Loader data type ─────────────────────────────────────────────────────────

type ModeLoaderData = {
	pool: CanonicalCard[];
};

// ─── Card type pills ──────────────────────────────────────────────────────────

const CARD_TYPES = [
	"mode.type.hero",
	"mode.type.weapon",
	"mode.type.equipment",
	"mode.type.action",
	"mode.type.attack_action",
	"mode.type.attack_reaction",
	"mode.type.defense_reaction",
	"mode.type.instant",
	"mode.type.ally",
];

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/fabble/$mode")({
	beforeLoad: ({ params }) => {
		if (params.mode !== "standard" && params.mode !== "chaos") {
			throw redirect({ to: "/fabble" });
		}
	},
	loader: async ({ params }): Promise<ModeLoaderData> => {
		const mode = params.mode as FabbleMode;

		// Dynamic import: loads the card package lazily (not in the initial bundle).
		// @flesh-and-blood/cards is in dependencies so it's available at runtime.
		const { cards } = await import("@flesh-and-blood/cards");
		const rawCards = cards as unknown as RawCard[];

		let searchPool: CanonicalCard[];
		let dailyPool: CanonicalCard[];

		if (mode === "chaos") {
			const chaosPool = buildChaosPool(rawCards);
			searchPool = chaosPool;
			// Chaos daily: all eligible non-banned cards (players can still guess banned cards)
			dailyPool = chaosPool.filter((c) => !c.isBanned && !c.isAmbiguous);
		} else {
			searchPool = buildStandardSearchPool(rawCards);
			// Standard daily: the curated 350-card selection from fabble-admin
			dailyPool = STANDARD_SELECTION as unknown as CanonicalCard[];
		}

		// Populate store before component renders — eliminates useEffect init cycle
		useFabbleStore.getState().initMode(mode, searchPool, dailyPool, STANDARD_SELECTION_VERSION);

		return { pool: searchPool };
	},
	component: FabbleModeRouteComponent,
});

function CardTypePills() {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex flex-col gap-2 w-full max-w-2xl mx-auto px-4 pb-2">
			<span className="text-xs font-semibold text-subtle uppercase tracking-wide">
				{t("mode.eligible_types_label")}
			</span>
			<div className="flex gap-1 w-full min-w-0">
				{CARD_TYPES.map((key) => (
					<span
						key={key}
						className="flex-1 min-w-0 flex items-center justify-center text-center px-1 py-0.5 rounded-full text-xs font-medium bg-surface border border-border-primary text-muted leading-tight"
					>
						{t(key)}
					</span>
				))}
			</div>
		</div>
	);
}

function FabbleModeRouteComponent() {
	const { mode } = Route.useParams() as { mode: FabbleMode };
	const { t } = useTranslation("fabble");
	const { pool } = Route.useLoaderData();
	const resetSession = useFabbleStore((s) => s.resetSession);

	const [showRules, setShowRules] = useState(false);

	const {
		daily,
		guesses,
		status,
		guessCount,
		guessLimit,
		streak,
		firstVisitPending,
		submitGuess,
		submitError,
		dismissFirstVisit,
		suppressGridAnimation,
		remainingGuesses,
		hints,
		availableHintCount,
		revealedHintCount,
		revealHint,
		activeRotation,
	} = useFabbleGame(mode);

	// On back-navigation the component re-mounts while status is already won/lost —
	// initialise directly to true so there is no blank gap or animation delay.
	const [showPostSolve, setShowPostSolve] = useState(
		() => status === "won" || status === "lost",
	);

	// When the player actively wins/loses during this session, reveal post-solve
	// after the tile-flip animation. suppressGridAnimation skips the delay for
	// sessions restored from localStorage.
	useEffect(() => {
		if (status === "won" || status === "lost") {
			if (suppressGridAnimation) {
				setShowPostSolve(true);
				return;
			}
			const timer = setTimeout(
				() => setShowPostSolve(true),
				POST_SOLVE_DELAY_MS,
			);
			return () => clearTimeout(timer);
		}
		setShowPostSolve(false);
	}, [status, suppressGridAnimation]);

	// Recovery: if the store says the game is already over (e.g. corrupted session
	// restored as in_progress), surfacing game_over forces the post-solve panel open
	// so the user is never stuck on a broken unsubmittable input.
	const handleSubmit = useCallback(
		(name: string) => {
			const { gameOver } = submitGuess(name);
			if (gameOver) setShowPostSolve(true);
		},
		[submitGuess],
	);

	// Memoize so useAutocomplete's useMemo doesn't bust on every parent re-render
	const alreadyGuessed = useMemo(() => guesses.map((g) => g.name), [guesses]);

	const handleReset = useCallback(() => {
		resetSession(mode);
		setShowPostSolve(false);
	}, [resetSession, mode]);

	const handleCloseRules = useCallback(() => {
		setShowRules(false);
		if (firstVisitPending) {
			dismissFirstVisit();
		}
	}, [firstVisitPending, dismissFirstVisit]);

	if (status === "idle") {
		return (
			<div className="flex items-center justify-center min-h-48 w-full">
				<span className="text-muted text-sm">{t("landing.title")}…</span>
			</div>
		);
	}

	return (
		<div className="fabble-page-enter flex flex-col items-center w-full">
			{/* Full-width header — intentionally outside the max-width constraint */}
			<FabbleHeader />

			<div className="flex flex-col items-center w-full max-w-4xl mx-auto pb-8">
				<CardTypePills />

				<PuzzleToolbar
					mode={mode}
					guessCount={guessCount}
					guessLimit={guessLimit}
					onOpenRules={() => setShowRules(true)}
					onReset={handleReset}
					activeRotation={activeRotation}
				/>

				{status === "in_progress" && mode === "standard" && (
					<HintPanel
						hints={hints}
						availableHintCount={availableHintCount}
						revealedHintCount={revealedHintCount}
						onReveal={revealHint}
					/>
				)}

				<div className="mt-4 w-full px-4">
					{status === "in_progress" ? (
						<GuessInput
							pool={pool}
							alreadyGuessed={alreadyGuessed}
							onSubmit={handleSubmit}
							submitError={submitError}
							guessesRemaining={remainingGuesses}
						/>
					) : showPostSolve && daily ? (
						<PostSolvePanel
							daily={daily}
							guesses={guesses}
							hasWon={status === "won"}
							streak={streak}
							mode={mode}
						/>
					) : null}
				</div>

				<div className="w-full px-2 mt-4">
					<GuessGrid
						rows={guesses}
						guessLimit={guessLimit}
						suppressGridAnimation={suppressGridAnimation}
						pool={pool}
						dailyName={daily?.name ?? ""}
					/>
				</div>
			</div>

			{(firstVisitPending || showRules) && (
				<RulesModal
					isFirstVisit={firstVisitPending}
					onClose={handleCloseRules}
				/>
			)}
		</div>
	);
}
