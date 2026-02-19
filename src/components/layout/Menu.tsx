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
import { ThemeToggle } from "./ThemeToggle.tsx";

const navigation = [
	{ name: "Home", route: "/", icon: Home },
	{ name: "Card Creator", route: "/card-creator", icon: Paintbrush },
	{ name: "Gallery", route: "/gallery", icon: Images },
	{ name: "Roadmap", route: "/roadmap", icon: MapIcon },
	{ name: "Contact", route: "/contact", icon: MessageCircle },
];

export function Menu() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();

	const currentRouteName = navigation.find(
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
															<Link
																to={item.route}
																onClick={() => setSidebarOpen(false)}
																className={[
																	item.route === location.pathname
																		? "bg-surface-active text-heading"
																		: "text-menu-inactive hover:bg-surface-active hover:text-heading",
																	"group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
																].join(" ")}
															>
																<item.icon
																	className={[
																		item.route === location.pathname
																			? "text-heading"
																			: "text-menu-icon-inactive group-hover:text-heading",
																		"size-6 shrink-0",
																	].join(" ")}
																	aria-hidden="true"
																/>
																{item.name}
															</Link>
														</li>
													))}
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
					<nav className="mt-5 flex flex-1 flex-col gap-y-5">
						<ul className="flex flex-col gap-y-7">
							<li>
								<ul className="-mx-2 space-y-1">
									{navigation.map((item) => (
										<li key={item.name}>
											<Link
												to={item.route}
												className={[
													item.route === location.pathname
														? "bg-surface-active text-heading"
														: "text-menu-inactive hover:bg-surface-active hover:text-heading",
													"group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
												].join(" ")}
											>
												<item.icon
													className={[
														item.route === location.pathname
															? "text-heading"
															: "text-menu-icon-inactive group-hover:text-heading",
														"size-6 shrink-0",
													].join(" ")}
													aria-hidden="true"
												/>
												{item.name}
											</Link>
										</li>
									))}
								</ul>
							</li>
						</ul>
						<ThemeToggle />
					</nav>
				</div>
			</div>

			{/* Mobile top bar */}
			<div className="sticky top-0 z-40 flex items-center justify-between gap-x-6 bg-surface px-4 py-4 shadow-xs sm:px-6 lg:hidden">
				<div className="flex items-center gap-x-6">
					<button
						type="button"
						className="-m-2.5 p-2.5 text-primary lg:hidden"
						onClick={() => setSidebarOpen(true)}
					>
						<span className="sr-only">Open sidebar</span>
						<MenuIcon className="size-6" aria-hidden="true" />
					</button>
					<div className="flex flex-row items-center text-sm/6 font-semibold text-primary">
						<img
							src={FabkitLogoNotext}
							alt="FABKIT Logo"
							className="h-8 pr-2"
						/>
						FaBKit
						{currentRouteName && ` - ${currentRouteName}`}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<ThemeToggle />
				</div>
			</div>
		</div>
	);
}
