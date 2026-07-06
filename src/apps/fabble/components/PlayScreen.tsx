import { getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { FabbleMode } from "../config";
import { MAX_GUESSES } from "../config";
import { useFabbleStore } from "../stores/fabble";
import { CardSearchInput } from "./CardSearchInput";
import { GuessHistory } from "./GuessHistory";
import { StatusBar } from "./StatusBar";
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
	const devReset = useFabbleStore((s) => s.devReset);
	const session = useFabbleStore((s) => s.sessions[mode]);
	const cardsById = useFabbleStore((s) => s.cardsById);

	useEffect(() => {
		ingestDataset(dataset);
	}, [dataset, ingestDataset]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only (re)start once per mode once the dataset is ingested
	useEffect(() => {
		if (!cardsById) return;
		if (session) return;
		startOrRestoreSession(mode);
	}, [mode, cardsById]);

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
			{session.status === "playing" && <CardSearchInput mode={mode} />}
			{session.status !== "playing" && answer && (
				<p className="text-center text-body">
					{session.status === "won"
						? t("end.solved_in", { count: session.guesses.length })
						: t("end.defeat_reveal", { name: answer.name })}
				</p>
			)}
			<GuessHistory mode={mode} />
		</div>
	);
}
