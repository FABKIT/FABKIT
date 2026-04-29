import {
	Dialog,
	DialogPanel,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import type { FileRouteTypes } from "@tanstack/react-router";
import { Link, useLocation } from "@tanstack/react-router";
import {
	Bug,
	Home,
	Images,
	Map as MapIcon,
	Menu as MenuIcon,
	MessageCircle,
	Paintbrush,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import FabkitLogo from "../../assets/Fabkitlogo.svg";
import FabkitLogoNotext from "../../assets/Fabkitlogo_notext.svg";
import { useBugReport } from "../../services/bug-report";
import { LanguageToggle } from "./LanguageToggle.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";

type NavChild = {
	nameKey: string;
	route: FileRouteTypes["to"];
	icon: React.ElementType;
};

type NavItem = NavChild & {
	/**
	 * Visual sub-items grouped under this nav entry in the sidebar.
	 * Note: /gallery is a flat sibling route in the router, but is visually
	 * grouped under Card Creator in the nav.
	 */
	visualChildren?: NavChild[];
	/**
	 * Which routes should mark this nav item as active.
	 * Falls back to visualChildren routes when not provided.
	 */
	activeRoutes?: string[];
};

const navigation: NavItem[] = [
	{ nameKey: "nav.home", route: "/", icon: Home },
	{
		nameKey: "nav.card_creator",
		route: "/card-creator",
		icon: Paintbrush,
		visualChildren: [
			{ nameKey: "nav.gallery", route: "/gallery", icon: Images },
		],
	},
	{ nameKey: "nav.roadmap", route: "/roadmap", icon: MapIcon },
	{ nameKey: "nav.contact", route: "/contact", icon: MessageCircle },
];

// Derived flat list of all navigable items — used for current route lookup.
// Computed at module scope to avoid recalculating on every render.
const allItems = navigation.flatMap((item) =>
	item.visualChildren ? [item, ...item.visualChildren] : [item],
);

function NavLink({
	item,
	currentPath,
	onClick,
}: {
	item: NavItem;
	currentPath: string;
	onClick?: () => void;
}) {
	const { t } = useTranslation();

	const activeRoutes =
		item.activeRoutes ?? item.visualChildren?.map((c) => c.route);
	const isActive =
		item.route === currentPath ||
		activeRoutes?.some((route) => route === currentPath);

	return (
		<Link
			to={item.route}
			onClick={onClick}
			aria-current={isActive ? "page" : undefined}
			className={[
				isActive
					? "bg-surface-active text-heading"
					: "text-menu-inactive hover:bg-surface-active hover:text-heading",
				"group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
			].join(" ")}
		>
			<item.icon
				className={[
					isActive
						? "text-heading"
						: "text-menu-icon-inactive group-hover:text-heading",
					"size-6 shrink-0",
				].join(" ")}
				aria-hidden="true"
			/>
			{t(item.nameKey)}
		</Link>
	);
}

function SubNavLink({
	item,
	currentPath,
	onClick,
}: {
	item: NavChild;
	currentPath: string;
	onClick?: () => void;
}) {
	const { t } = useTranslation();
	const isActive = item.route === currentPath;

	return (
		<Link
			to={item.route}
			onClick={onClick}
			aria-current={isActive ? "page" : undefined}
			className={[
				isActive ? "text-heading" : "text-menu-inactive hover:text-heading",
				"group flex items-center gap-x-2 rounded-sm px-2 py-1 text-xs font-semibold",
			].join(" ")}
		>
			<item.icon
				className={[
					isActive
						? "text-primary"
						: "text-menu-icon-inactive group-hover:text-heading",
					"size-3.5 shrink-0",
				].join(" ")}
				aria-hidden="true"
			/>
			<span
				className={[
					"border-b-2 pb-1 leading-tight",
					isActive ? "border-primary" : "border-transparent",
				].join(" ")}
			>
				{t(item.nameKey)}
			</span>
		</Link>
	);
}

function SubNavList({
	items,
	currentPath,
	onClick,
}: {
	items: NavChild[];
	currentPath: string;
	onClick?: () => void;
}) {
	return (
		<ul className="mt-1.5 space-y-0.5">
			{items.map((child, idx) => {
				const isLast = idx === items.length - 1;
				return (
					<li key={child.route} className="flex items-stretch">
						{/* L-connector: vertical runs full height on non-last items to connect
						    to the next sibling; last item only runs top-to-center. Horizontal
						    is always at 50% so it aligns with the sub-item icon regardless of
						    active state. */}
						<div className="relative ml-3 w-3 shrink-0">
							<div
								className={[
									"absolute left-0 top-0 border-l border-border",
									isLast ? "bottom-1/2" : "bottom-0",
								].join(" ")}
							/>
							<div className="absolute left-0 right-0 top-1/2 border-t border-border" />
						</div>
						<div className="flex items-center flex-1 min-w-0 py-0.5 pl-1">
							<SubNavLink
								item={child}
								currentPath={currentPath}
								onClick={onClick}
							/>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

function NavList({
	currentPath,
	onNavigate,
}: {
	currentPath: string;
	onNavigate?: () => void;
}) {
	return (
		<ul className="-mx-2 space-y-1">
			{navigation.map((item) => (
				<li key={item.route}>
					<NavLink item={item} currentPath={currentPath} onClick={onNavigate} />
					{item.visualChildren && item.visualChildren.length > 0 && (
						<SubNavList
							items={item.visualChildren}
							currentPath={currentPath}
							onClick={onNavigate}
						/>
					)}
				</li>
			))}
		</ul>
	);
}

export function Menu() {
	const { t } = useTranslation();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();

	const currentRouteName = allItems.find(
		(item) => item.route === location.pathname,
	)?.nameKey;

	const handleOpen = useCallback(() => setSidebarOpen(true), []);
	const handleClose = useCallback(() => setSidebarOpen(false), []);
	const handleDialogClose = useCallback(() => setSidebarOpen(false), []);
	const { trigger } = useBugReport();

	return (
		<div>
			{/* Mobile sidebar */}
			<Transition show={sidebarOpen}>
				<Dialog className="relative z-50 lg:hidden" onClose={handleDialogClose}>
					<TransitionChild
						enter="transition-opacity ease-linear duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="transition-opacity ease-linear duration-300"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-gray-900/80" />
					</TransitionChild>

					<div className="fixed inset-0 flex">
						<TransitionChild
							enter="transition ease-in-out duration-300 transform"
							enterFrom="-translate-x-full"
							enterTo="translate-x-0"
							leave="transition ease-in-out duration-300 transform"
							leaveFrom="translate-x-0"
							leaveTo="-translate-x-full"
						>
							<DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
								{/* Close button — placed directly in DialogPanel, outside any
								    TransitionChild, to avoid an extra animated wrapper */}
								<div className="absolute top-0 left-full flex w-16 justify-center pt-5">
									<button
										type="button"
										className="-m-2.5 p-2.5"
										onClick={handleClose}
									>
										<span className="sr-only">{t("nav.close_sidebar")}</span>
										<X className="size-6 text-white" aria-hidden="true" />
									</button>
								</div>

								{/* Mobile sidebar content */}
								<div className="flex grow flex-col gap-y-5 overflow-y-auto bg-surface px-6 pb-2">
									<div className="flex h-16 shrink-0 items-center gap-1 text-primary">
										<img
											className="h-8 w-auto"
											src={FabkitLogoNotext}
											alt={t("nav.logo_alt")}
										/>
										<span className="text-sm/6 font-semibold text-primary">
											{t("nav.brand")}
										</span>
									</div>
									<nav className="flex flex-1 flex-col">
										<ul className="flex flex-1 flex-col gap-y-7">
											<li>
												<NavList
													currentPath={location.pathname}
													onNavigate={handleClose}
												/>
											</li>
											<li>
												<hr className="h-px border-0 bg-border" />
												<ul className="-mx-2 mt-3 space-y-1">
													<li>
														<ThemeToggle />
													</li>
													<li>
														<LanguageToggle />
													</li>
													<li>
														<button
															type="button"
															onClick={trigger}
															className="group flex w-full gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-menu-inactive hover:bg-surface-active hover:text-heading"
														>
															<Bug
																className="size-6 shrink-0 text-menu-icon-inactive group-hover:text-heading"
																aria-hidden="true"
															/>
															{t("bug_report.button")}
														</button>
													</li>
												</ul>
											</li>
										</ul>
									</nav>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</Dialog>
			</Transition>

			{/* Static sidebar for desktop */}
			<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
				<div className="flex grow flex-col border-r border-border bg-surface px-6">
					<div className="flex h-48 flex-col items-center justify-center gap-1">
						<img
							className="h-30 w-auto"
							src={FabkitLogo}
							alt={t("nav.logo_with_text_alt")}
						/>
						<p className="text-xs text-muted">
							{t("footer.version", { version: __APP_VERSION__ })}
						</p>
					</div>
					<hr className="h-px border-0 bg-border" />
					<nav className="mt-5 flex flex-1 flex-col">
						<ul className="flex flex-1 flex-col gap-y-7">
							<li>
								<NavList currentPath={location.pathname} />
							</li>
							<li className="mt-auto pb-16">
								<hr className="h-px border-0 bg-border" />
								<ul className="-mx-2 mt-3 space-y-1">
									<li>
										<ThemeToggle />
									</li>
									<li>
										<LanguageToggle />
									</li>
									<li>
										<button
											type="button"
											onClick={trigger}
											className="group flex w-full gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-menu-inactive hover:bg-surface-active hover:text-heading"
										>
											<Bug
												className="size-6 shrink-0 text-menu-icon-inactive group-hover:text-heading"
												aria-hidden="true"
											/>
											{t("bug_report.button")}
										</button>
									</li>
								</ul>
							</li>
						</ul>
					</nav>
				</div>
			</div>

			{/* Mobile top bar — fixed (not sticky) because its parent <div> isn't
				tall enough to act as a sticky containing block. */}
			<div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-x-6 bg-surface px-4 py-4 shadow-xs sm:px-6 lg:hidden">
				<button
					type="button"
					className="-m-2.5 p-2.5 text-primary lg:hidden"
					onClick={handleOpen}
				>
					<span className="sr-only">{t("nav.open_sidebar")}</span>
					<MenuIcon className="size-6" aria-hidden="true" />
				</button>
				<div className="flex flex-row items-center text-sm/6 font-semibold text-primary">
					<img
						src={FabkitLogoNotext}
						alt={t("nav.logo_with_text_alt")}
						className="h-8 pr-2"
					/>
					{t("nav.brand")}
					{currentRouteName && ` - ${t(currentRouteName)}`}
				</div>
			</div>
		</div>
	);
}
