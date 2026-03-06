import { createRootRoute, Outlet } from "@tanstack/react-router";
import { DevBanner } from "../components/DevBanner.tsx";
import { Footer } from "../components/layout/Footer.tsx";
import { Menu } from "../components/layout/Menu.tsx";
import { ServiceWorker } from "../components/ServiceWorker.tsx";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<>
			<Menu />
			<main className="flex flex-col items-center flex-1 lg:pl-72">
				<Outlet />
			</main>
			<Footer />
			<ServiceWorker />
			<DevBanner />
		</>
	);
}
