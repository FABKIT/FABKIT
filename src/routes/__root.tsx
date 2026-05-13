import { AppErrorFallback } from "@fabkit/platform/components/AppErrorFallback";
import { DevBanner } from "@fabkit/platform/components/DevBanner";
import { Footer } from "@fabkit/platform/components/layout/Footer";
import { Menu } from "@fabkit/platform/components/layout/Menu";
import { ServiceWorker } from "@fabkit/platform/components/ServiceWorker";
import {
	clearLastBoundaryError,
	setLastBoundaryError,
} from "@fabkit/platform/error-context";
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import type { ErrorInfo } from "react";
import { ErrorBoundary } from "react-error-boundary";

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
