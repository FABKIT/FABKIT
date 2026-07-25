import { CardSearchInput } from "@fabkit/apps/fabble/components/CardSearchInput";
import { EndPanel } from "@fabkit/apps/fabble/components/EndPanel";
import { GuessHistory } from "@fabkit/apps/fabble/components/GuessHistory";
import { HintsRow } from "@fabkit/apps/fabble/components/HintsRow";
import { RainbowHintToast } from "@fabkit/apps/fabble/components/RainbowHintToast";
import { RulesDialog } from "@fabkit/apps/fabble/components/RulesDialog";
import { StatusBar } from "@fabkit/apps/fabble/components/StatusBar";
import { ThemeBanner } from "@fabkit/apps/fabble/components/ThemeBanner";
import { TypeChipsRow } from "@fabkit/apps/fabble/components/TypeChipsRow";
import type { FabbleMode } from "@fabkit/apps/fabble/config";
import { MAX_GUESSES, REVEAL_TOTAL_MS } from "@fabkit/apps/fabble/config";
import { getToday } from "@fabkit/apps/fabble/game/date";
import { hasRainbowPartial } from "@fabkit/apps/fabble/game/rainbow-hint";
import {
	getOrderedResults,
	useFabbleStore,
} from "@fabkit/apps/fabble/stores/fabble";
import { getRouteApi } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const routeApi = getRouteApi("/fabble");

export interface PlayScreenProps {
	mode: FabbleMode;
}

export function PlayScreen({ mode }: PlayScreenProps) {
	const { t } = useTranslation("fabble");
	const dataset = routeApi.useLoaderData();

	const ingestDataset = useFabbleStore((s) => s.ingestDataset);
	const startOrRestoreSession = useFabbleStore((s) => s.startOrRestoreSession);
	const advanceToNewDay = useFabbleStore((s) => s.advanceToNewDay);
	const devReset = useFabbleStore((s) => s.devReset);
	const revealHint = useFabbleStore((s) => s.revealHint);
	const session = useFabbleStore((s) => s.sessions[mode]);
	const streaks = useFabbleStore((s) => s.streaks[mode]);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const hasSeenRainbowHint = useFabbleStore((s) => s.hasSeenRainbowHint);
	const markRainbowHintSeen = useFabbleStore((s) => s.markRainbowHintSeen);
	const dismissedThemeDate = useFabbleStore((s) => s.dismissedThemeDate[mode]);
	const dismissTheme = useFabbleStore((s) => s.dismissTheme);

	const [showEndPanel, setShowEndPanel] = useState(false);
	const [rulesOpen, setRulesOpen] = useState(false);

	useEffect(() => {
		ingestDataset(dataset);
	}, [dataset, ingestDataset]);

	useEffect(() => {
		if (!cardsById) return;
		if (session) return;
		startOrRestoreSession(mode);
	}, [mode, cardsById, session, startOrRestoreSession]);

	useEffect(() => {
		if (!session || session.status === "playing") {
			setShowEndPanel(false);
			return;
		}
		const lastGuessId = session.order[session.order.length - 1];
		const alreadyAnimated =
			!lastGuessId || session.animatedGuessIds.includes(lastGuessId);
		if (alreadyAnimated) {
			setShowEndPanel(true);
			return;
		}
		const timer = setTimeout(() => setShowEndPanel(true), REVEAL_TOTAL_MS);
		return () => clearTimeout(timer);
	}, [session]);

	const handleReset = useCallback(() => {
		devReset(mode);
		startOrRestoreSession(mode);
	}, [devReset, mode, startOrRestoreSession]);

	const handleDismissTheme = useCallback(() => {
		if (!session) return;
		dismissTheme(mode, session.date);
	}, [dismissTheme, mode, session]);

	if (!cardsById) return null;

	if (!session) {
		return <p className="text-muted">{t("errors.no_puzzle")}</p>;
	}

	const answer = cardsById.get(session.answerId);

	const orderedResults = getOrderedResults(session);
	const lastResult = orderedResults[orderedResults.length - 1];
	const lastCard = lastResult ? cardsById.get(lastResult.guessId) : undefined;
	const announcement =
		lastResult && lastCard
			? t("feedback.announce", {
					name: lastCard.name,
					matches: lastResult.columns.filter((c) => c.state === "match").length,
					total: lastResult.columns.length,
				})
			: "";

	const rainbowHintTriggered =
		!hasSeenRainbowHint && orderedResults.some(hasRainbowPartial);

	return (
		<div className="flex w-full flex-col items-center gap-3">
			<span aria-live="polite" className="sr-only">
				{announcement}
			</span>
			<TypeChipsRow />
			<StatusBar
				mode={mode}
				guessCount={session.guesses.length}
				maxGuesses={MAX_GUESSES[mode]}
				onReset={handleReset}
				onHelp={() => setRulesOpen(true)}
			/>
			{session.theme && dismissedThemeDate !== session.date && (
				<ThemeBanner theme={session.theme} onDismiss={handleDismissTheme} />
			)}
			{mode === "standard" && answer && (
				<HintsRow
					answer={answer}
					guessCount={session.guesses.length}
					hintsRevealed={session.hintsRevealed}
					onReveal={(hintIndex) => revealHint(mode, hintIndex)}
				/>
			)}
			{session.status === "playing" && <CardSearchInput mode={mode} />}
			{rainbowHintTriggered && (
				<RainbowHintToast onDismiss={markRainbowHintSeen} />
			)}
			{session.status !== "playing" && answer && showEndPanel && (
				<EndPanel
					mode={mode}
					session={session}
					answer={answer}
					streaks={
						streaks ?? {
							schema: 1,
							current: 0,
							best: 0,
							lastResultDate: null,
							lastResult: null,
						}
					}
					today={getToday()}
					onNewDay={() => advanceToNewDay(mode)}
				/>
			)}
			<GuessHistory mode={mode} />
			<RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
		</div>
	);
}
