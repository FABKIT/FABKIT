import { PlayScreen } from "@fabkit/apps/fabble/components/PlayScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble/chaos")({
	component: () => <PlayScreen mode="chaos" />,
});
