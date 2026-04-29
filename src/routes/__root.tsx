import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import type { ErrorInfo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AppErrorFallback } from "../components/AppErrorFallback.tsx";
import { DevBanner } from "../components/DevBanner.tsx";
import { Footer } from "../components/layout/Footer.tsx";
import { Menu } from "../components/layout/Menu.tsx";
import { ServiceWorker } from "../components/ServiceWorker.tsx";
import {
	clearLastBoundaryError,
	setLastBoundaryError,
} from "../services/error-context.ts";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const { pathname } = useLocation();

	function handleError(error: unknown, errorInfo: ErrorInfo) {
		console.error("[ErrorBoundary]", error, errorInfo.componentStack);
		setLastBoundaryError({
			error,
			componentStack: errorInfo.componentStack ?? "",
		});
	}

	return (
		<>
			<Menu />
			<main className="flex flex-col items-center flex-1 pt-16 lg:pt-0 lg:pl-72">
				<ErrorBoundary
					FallbackComponent={AppErrorFallback}
					onError={handleError}
					onReset={clearLastBoundaryError}
					resetKeys={[pathname]}
				>
					<Outlet />
				</ErrorBoundary>
			</main>
			<Footer />
			<ServiceWorker />
			<DevBanner />
		</>
	);
}
