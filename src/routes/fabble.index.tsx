import { ModeSelect } from "@fabkit/apps/fabble/components/ModeSelect/ModeSelect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble/")({
	component: FabbleLandingRoute,
});

function FabbleLandingRoute() {
	return <ModeSelect />;
}
