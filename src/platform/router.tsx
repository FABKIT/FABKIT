import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";
import { NotFound } from "./components/not-found.tsx";

// Github Pages doesn't support SPA routing, so we'll use hash routing.
const hashHistory = createHashHistory();

// Create a new router instance
export const router = createRouter({
	routeTree,
	history: hashHistory,
	defaultNotFoundComponent: () => <NotFound />,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
