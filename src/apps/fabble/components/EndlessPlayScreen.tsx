import { EndlessCardSearchInput } from "@fabkit/apps/fabble/components/EndlessCardSearchInput";
import { EndlessEndPanel } from "@fabkit/apps/fabble/components/EndlessEndPanel";
import { EndlessGuessHistory } from "@fabkit/apps/fabble/components/EndlessGuessHistory";
import { EndlessStatusBar } from "@fabkit/apps/fabble/components/EndlessStatusBar";
import { RainbowHintToast } from "@fabkit/apps/fabble/components/RainbowHintToast";
import { RulesDialog } from "@fabkit/apps/fabble/components/RulesDialog";
import { TypeChipsRow } from "@fabkit/apps/fabble/components/TypeChipsRow";
import { REVEAL_TOTAL_MS } from "@fabkit/apps/fabble/config";
import { hasRainbowPartial } from "@fabkit/apps/fabble/game/rainbow-hint";
import {
	getOrderedEndlessResults,
	useFabbleStore,
} from "@fabkit/apps/fabble/stores/fabble";
import { getRouteApi } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const routeApi = getRouteApi("/fabble");

export function EndlessPlayScreen() {
	const { t } = useTranslation("fabble");
	const dataset = routeApi.useLoaderData();

	const ingestDataset = useFabbleStore((s) => s.ingestDataset);
	const startOrRestoreEndless = useFabbleStore((s) => s.startOrRestoreEndless);
	const giveUpEndless = useFabbleStore((s) => s.giveUpEndless);
	const nextEndlessPuzzle = useFabbleStore((s) => s.nextEndlessPuzzle);
	const session = useFabbleStore((s) => s.endlessSession);
	const streak = useFabbleStore((s) => s.endlessStreak);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const hasSeenRainbowHint = useFabbleStore((s) => s.hasSeenRainbowHint);
	const markRainbowHintSeen = useFabbleStore((s) => s.markRainbowHintSeen);

	const [showEndPanel, setShowEndPanel] = useState(false);
	const [rulesOpen, setRulesOpen] = useState(false);

	useEffect(() => {
		ingestDataset(dataset);
	}, [dataset, ingestDataset]);

	useEffect(() => {
		if (!cardsById) return;
		if (session) return;
		startOrRestoreEndless();
	}, [cardsById, session, startOrRestoreEndless]);

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

	const handleGiveUp = useCallback(() => {
		giveUpEndless();
	}, [giveUpEndless]);

	const handleNext = useCallback(() => {
		nextEndlessPuzzle();
	}, [nextEndlessPuzzle]);

	if (!cardsById) return null;

	if (!session) {
		return <p className="text-muted">{t("errors.no_puzzle")}</p>;
	}

	const answer = cardsById.get(session.answerId);

	const orderedResults = getOrderedEndlessResults(session);
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
			<EndlessStatusBar
				guessCount={session.guesses.length}
				isPlaying={session.status === "playing"}
				onGiveUp={handleGiveUp}
				onHelp={() => setRulesOpen(true)}
			/>
			{session.status === "playing" && <EndlessCardSearchInput />}
			{rainbowHintTriggered && (
				<RainbowHintToast onDismiss={markRainbowHintSeen} />
			)}
			{session.status !== "playing" && answer && showEndPanel && (
				<EndlessEndPanel
					session={session}
					answer={answer}
					streak={streak}
					onNext={handleNext}
				/>
			)}
			<EndlessGuessHistory />
			<RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
		</div>
	);
}
