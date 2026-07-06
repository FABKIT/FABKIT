import { FabblePage } from "@fabkit/apps/fabble/components/FabblePage";
import { loadDataset } from "@fabkit/apps/fabble/data/load-dataset";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble")({
	loader: () => loadDataset(),
	staleTime: Number.POSITIVE_INFINITY,
	component: FabblePage,
});
