import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./i18n.ts";

import { router } from "./platform/router";
import { startConsoleInterceptor } from "./platform/bug-report";

// Register app providers
import "./apps/card-creator/index";
import "./apps/fabble/index";

startConsoleInterceptor();

const root = document.getElementById("root");
createRoot(root || document.body).render(
	<StrictMode>
		<ThemeProvider attribute="data-theme" defaultTheme="system">
			<RouterProvider router={router} />
		</ThemeProvider>
	</StrictMode>,
);
