import {
	Dialog,
	DialogPanel,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import { Link, useLocation } from "@tanstack/react-router";
import {
	Home,
	Images,
	Map as MapIcon,
	Menu as MenuIcon,
	MessageCircle,
	Paintbrush,
	X,
} from "lucide-react";
import { useState } from "react";
import FabkitLogo from "../../assets/Fabkitlogo.svg";
import FabkitLogoNotext from "../../assets/Fabkitlogo_notext.svg";
import { LanguageToggle } from "./LanguageToggle.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";

type NavChild = { name: string; route: string; icon: React.ElementType };
type NavItem = NavChild & { children?: NavChild[] };

const navigation: NavItem[] = [
	{ name: "Home", route: "/", icon: Home },
	{
		name: "Card Creator",
		route: "/card-creator",
		icon: Paintbrush,
		children: [{ name: "Gallery", route: "/gallery", icon: Images }],
	},
	{ name: "Roadmap", route: "/roadmap", icon: MapIcon },
	{ name: "Contact", route: "/contact", icon: MessageCircle },
];

function NavLink({
	item,
	currentPath,
	onClick,
}: {
	item: NavItem;
	currentPath: string;
	onClick?: () => void;
}) {
	const isActive =
		item.route === currentPath ||
		item.children?.some((child) => child.route === currentPath);
	return (
		<Link
			to={item.route}
			onClick={onClick}
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
			{item.name}
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
	const isActive = item.route === currentPath;
	return (
		<Link
			to={item.route}
			onClick={onClick}
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
				{item.name}
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
					<li key={child.name} className="flex items-stretch">
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

export function Menu() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();

	const allItems = navigation.flatMap((item) =>
		item.children ? [item, ...item.children] : [item],
	);
	const currentRouteName = allItems.find(
		(item) => item.route === location.pathname,
	)?.name;

	return (
		<div>
			{/* Mobile sidebar */}
			<Transition show={sidebarOpen}>
				<Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
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
								<TransitionChild
									enter="ease-in-out duration-300"
									enterFrom="opacity-0"
									enterTo="opacity-100"
									leave="ease-in-out duration-300"
									leaveFrom="opacity-100"
									leaveTo="opacity-0"
								>
									<div className="absolute top-0 left-full flex w-16 justify-center pt-5">
										<button
											type="button"
											className="-m-2.5 p-2.5"
											onClick={() => setSidebarOpen(false)}
										>
											<span className="sr-only">Close sidebar</span>
											<X className="size-6 text-white" aria-hidden="true" />
										</button>
									</div>
								</TransitionChild>

								{/* Mobile sidebar content */}
								<div className="flex grow flex-col gap-y-5 overflow-y-auto bg-surface px-6 pb-2">
									<div className="flex h-16 shrink-0 items-center gap-1 text-primary">
										<img className="h-8 w-auto" src={FabkitLogo} alt="FABKIT" />
										<h1 className="text-sm/6 font-semibold text-primary">
											FaBKit
										</h1>
									</div>
									<nav className="flex flex-1 flex-col">
										<ul className="flex flex-1 flex-col gap-y-7">
											<li>
												<ul className="-mx-2 space-y-1">
													{navigation.map((item) => (
														<li key={item.name}>
															<NavLink
																item={item}
																currentPath={location.pathname}
																onClick={() => setSidebarOpen(false)}
															/>
															{item.children && item.children.length > 0 && (
																<SubNavList
																	items={item.children}
																	currentPath={location.pathname}
																	onClick={() => setSidebarOpen(false)}
																/>
															)}
														</li>
													))}
												</ul>
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
					<div className="flex h-48 items-center justify-center">
						<img className="h-30 w-auto" src={FabkitLogo} alt="FABKIT Logo" />
					</div>
					<hr className="h-px border-0 bg-border" />
					<nav className="mt-5 flex flex-1 flex-col">
						<ul className="flex flex-1 flex-col gap-y-7">
							<li>
								<ul className="-mx-2 space-y-1">
									{navigation.map((item) => (
										<li key={item.name}>
											<NavLink item={item} currentPath={location.pathname} />
											{item.children && item.children.length > 0 && (
												<SubNavList
													items={item.children}
													currentPath={location.pathname}
												/>
											)}
										</li>
									))}
								</ul>
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
								</ul>
							</li>
						</ul>
					</nav>
				</div>
			</div>

			{/* Mobile top bar */}
			<div className="sticky top-0 z-40 flex items-center gap-x-6 bg-surface px-4 py-4 shadow-xs sm:px-6 lg:hidden">
				<button
					type="button"
					className="-m-2.5 p-2.5 text-primary lg:hidden"
					onClick={() => setSidebarOpen(true)}
				>
					<span className="sr-only">Open sidebar</span>
					<MenuIcon className="size-6" aria-hidden="true" />
				</button>
				<div className="flex flex-row items-center text-sm/6 font-semibold text-primary">
					<img src={FabkitLogoNotext} alt="FABKIT Logo" className="h-8 pr-2" />
					FaBKit
					{currentRouteName && ` - ${currentRouteName}`}
				</div>
			</div>
		</div>
	);
}
