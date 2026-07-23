import { FabbleLayout } from "@fabkit/apps/fabble/components/FabbleLayout";
import { loadDataset } from "@fabkit/apps/fabble/data/load-dataset";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble")({
	loader: () => loadDataset(),
	staleTime: Number.POSITIVE_INFINITY,
	component: FabbleLayoutRoute,
});

function FabbleLayoutRoute() {
	return (
		<FabbleLayout>
			<Outlet />
		</FabbleLayout>
	);
}
