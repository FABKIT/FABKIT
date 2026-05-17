import { FabbleHeader } from "@fabkit/apps/fabble/components/FabbleHeader";
import { PostSolvePanel } from "@fabkit/apps/fabble/components/PostSolve/PostSolvePanel";
import { GuessGrid } from "@fabkit/apps/fabble/components/Puzzle/GuessGrid";
import { GuessInput } from "@fabkit/apps/fabble/components/Puzzle/GuessInput";
import { HintPanel } from "@fabkit/apps/fabble/components/Puzzle/HintPanel";
import { PuzzleToolbar } from "@fabkit/apps/fabble/components/Puzzle/PuzzleToolbar";
import { RulesModal } from "@fabkit/apps/fabble/components/Rules/RulesModal";
import { useFabbleGame } from "@fabkit/apps/fabble/hooks/useFabbleGame";
import { POST_SOLVE_DELAY_MS } from "@fabkit/apps/fabble/lib/constants";
import type { CanonicalCard, FabbleMode } from "@fabkit/apps/fabble/lib/types";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabbleStore";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// ─── Loader data type ─────────────────────────────────────────────────────────

type ModeLoaderData = {
	pool: CanonicalCard[];
	version: string;
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
		const mode = params.mode as FabbleMode; // safe: guarded by beforeLoad
		const base = import.meta.env.BASE_URL ?? "/";
		const filename =
			mode === "chaos" ? "pool-chaos.json" : "pool-standard.json";

		const poolRes = await fetch(`${base}${filename}`);
		if (!poolRes.ok) {
			throw new Error(`Failed to fetch ${filename}: ${poolRes.status}`);
		}
		const data = await poolRes.json();

		// Populate store before component renders — eliminates useEffect init cycle
		useFabbleStore.getState().initMode(mode, data.pool, data.version);

		return { pool: data.pool, version: data.version };
	},
	component: FabbleModeRouteComponent,
});

function CardTypePills() {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex flex-col gap-2 w-full max-w-2xl mx-auto px-4 pb-2">
			<span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">
				{t("mode.eligible_types_label")}
			</span>
			<div className="flex flex-wrap lg:flex-nowrap gap-1.5 overflow-x-auto">
				{CARD_TYPES.map((key) => (
					<span
						key={key}
						className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-surface border border-border text-muted whitespace-nowrap"
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
	const [showPostSolve, setShowPostSolve] = useState(false);

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
		isSubmitting,
		dismissFirstVisit,
		suppressGridAnimation,
		hints,
		availableHintCount,
		revealedHintCount,
		revealHint,
		activeRotation,
	} = useFabbleGame(mode);

	// Show post-solve panel after tile flip animation, or immediately if restored
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

	// Memoize so useAutocomplete's useMemo doesn't bust on every parent re-render
	const alreadyGuessed = useMemo(() => guesses.map((g) => g.name), [guesses]);

	function handleReset() {
		resetSession(mode);
		setShowPostSolve(false);
	}

	function handleCloseRules() {
		setShowRules(false);
		if (firstVisitPending) {
			dismissFirstVisit();
		}
	}

	if (status === "idle") {
		return (
			<div className="flex items-center justify-center min-h-[200px] w-full">
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
							onSubmit={submitGuess}
							submitError={submitError}
							disabled={isSubmitting}
							guessesRemaining={Math.max(0, guessLimit - guessCount)}
						/>
					) : showPostSolve && daily ? (
						<PostSolvePanel
							daily={daily}
							guesses={guesses}
							status={status as "won" | "lost"}
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

