import { createFileRoute } from "@tanstack/react-router";
import { FabblePage } from "@apps/fabble/components/FabblePage";

export const Route = createFileRoute("/fabble")({
	component: FabblePage,
});
