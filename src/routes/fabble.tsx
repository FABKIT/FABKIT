import { createFileRoute } from "@tanstack/react-router";
import { FabblePage } from "@fabkit/apps/fabble/components/FabblePage";

export const Route = createFileRoute("/fabble")({
	component: FabblePage,
});
