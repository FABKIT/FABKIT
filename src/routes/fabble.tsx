import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble")({
	component: FabbleLayout,
});

function FabbleLayout() {
	return <Outlet />;
}
