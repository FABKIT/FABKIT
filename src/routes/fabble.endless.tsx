import { EndlessPlayScreen } from "@fabkit/apps/fabble/components/EndlessPlayScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble/endless")({
	component: EndlessPlayScreen,
});
