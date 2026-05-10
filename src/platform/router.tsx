import { createHashHistory, createRouter } from "@tanstack/react-router";
import { NotFound } from "../components/not-found.tsx";
import { routeTree } from "../routeTree.gen";

const hashHistory = createHashHistory();

export const router = createRouter({
	routeTree,
	history: hashHistory,
	defaultNotFoundComponent: () => <NotFound />,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
