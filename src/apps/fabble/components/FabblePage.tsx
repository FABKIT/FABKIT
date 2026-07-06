import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getDailyPuzzle } from "../game/daily";
import { getToday } from "../game/date";
import type { FabbleDataset } from "../types";

const routeApi = getRouteApi("/fabble");

export function FabblePage() {
	const { t } = useTranslation("fabble");
	const dataset = routeApi.useLoaderData();

	return (
		<div>
			<h1>{t("coming_soon")}</h1>
			{import.meta.env.DEV && <DevDatasetStatus dataset={dataset} />}
		</div>
	);
}

function DevDatasetStatus({ dataset }: { dataset: FabbleDataset }) {
	const today = getToday();
	const standard = getDailyPuzzle("standard", dataset, today);
	const chaos = getDailyPuzzle("chaos", dataset, today);
	const cardsById = new Map(dataset.cards.map((c) => [c.id, c]));

	return (
		<pre>
			{JSON.stringify(
				{
					datasetVersion: dataset.datasetVersion,
					cardCount: dataset.cards.length,
					standardAnswer: standard
						? cardsById.get(standard.answerId)?.name
						: null,
					standardTheme: standard?.theme ?? null,
					chaosAnswer: chaos ? cardsById.get(chaos.answerId)?.name : null,
				},
				null,
				2,
			)}
		</pre>
	);
}
