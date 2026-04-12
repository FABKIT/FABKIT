import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-form")({
	loader: () => {
		throw redirect({ to: "/card-creator" });
	},
	component: () => null,
});
