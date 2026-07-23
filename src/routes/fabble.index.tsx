import { ModeSelect } from "@fabkit/apps/fabble/components/ModeSelect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fabble/")({
	component: ModeSelect,
});
