import { getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FabbleMode } from "../config";
import { MAX_GUESSES, REVEAL_TOTAL_MS } from "../config";
import { getToday } from "../game/date";
import { useFabbleStore } from "../stores/fabble";
import { CardSearchInput } from "./CardSearchInput";
import { EndPanel } from "./EndPanel";
import { GuessHistory } from "./GuessHistory";
import { HintsRow } from "./HintsRow";
import { StatusBar } from "./StatusBar";
import { ThemeBanner } from "./ThemeBanner";
import { TypeChipsRow } from "./TypeChipsRow";

const routeApi = getRouteApi("/fabble");

interface PlayScreenProps {
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

	const [showEndPanel, setShowEndPanel] = useState(false);

	useEffect(() => {
		ingestDataset(dataset);
	}, [dataset, ingestDataset]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only (re)start once per mode once the dataset is ingested
	useEffect(() => {
		if (!cardsById) return;
		if (session) return;
		startOrRestoreSession(mode);
	}, [mode, cardsById]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only the fields read below should retrigger the delay
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
	}, [session?.status, session?.order, session?.animatedGuessIds]);

	if (!cardsById) return null;

	if (!session) {
		return <p className="text-muted">{t("errors.no_puzzle")}</p>;
	}

	const answer = cardsById.get(session.answerId);

	function handleReset() {
		devReset(mode);
		startOrRestoreSession(mode);
	}

	return (
		<div className="flex w-full flex-col items-center gap-6">
			<TypeChipsRow />
			<StatusBar
				mode={mode}
				guessCount={session.guesses.length}
				maxGuesses={MAX_GUESSES[mode]}
				onReset={handleReset}
			/>
			<ThemeBanner theme={session.theme} />
			{mode === "standard" && answer && (
				<HintsRow
					answer={answer}
					guessCount={session.guesses.length}
					hintsRevealed={session.hintsRevealed}
					onReveal={(hintIndex) => revealHint(mode, hintIndex)}
				/>
			)}
			{session.status === "playing" && <CardSearchInput mode={mode} />}
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
		</div>
	);
}
