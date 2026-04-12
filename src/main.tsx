import {
	createHashHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./i18n.ts";

import { NotFound } from "./components/not-found.tsx";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Github Pages doesn't support SPA routing, so we'll use hash routing.
const hashHistory = createHashHistory();

// Create a new router instance
const router = createRouter({
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

const root = document.getElementById("root");
createRoot(root || document.body).render(
	<StrictMode>
		<ThemeProvider attribute="data-theme" defaultTheme="system">
			<RouterProvider router={router} />
		</ThemeProvider>
	</StrictMode>,
);
