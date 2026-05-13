import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./i18n.ts";

import "./apps/card-creator/index";
import { startConsoleInterceptor } from "@fabkit/platform/bug-report";
import { router } from "./platform/router";

startConsoleInterceptor();

const root = document.getElementById("root");
createRoot(root || document.body).render(
	<StrictMode>
		<ThemeProvider attribute="data-theme" defaultTheme="system">
			<RouterProvider router={router} />
		</ThemeProvider>
	</StrictMode>,
);
