import { FabblePage } from "@fabkit/apps/fabble/components/FabblePage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble")({
	component: FabblePage,
});
