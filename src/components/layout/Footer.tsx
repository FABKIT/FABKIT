import type { ComponentType, SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { Bluesky } from "../icons/Bluesky.tsx";
import { Discord } from "../icons/Discord.tsx";
import { Github } from "../icons/Github.tsx";

type NavItem = {
	name: string;
	href: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const navigation: NavItem[] = [
	{
		name: "GitHub",
		href: "https://github.com/FABKIT/FABKIT",
		icon: Github,
	},
	{
		name: "Discord",
		href: "https://discord.gg/4twcdby9xp",
		icon: Discord,
	},
	{
		name: "Bluesky",
		href: "https://bsky.app/profile/teamfabkit.bsky.social",
		icon: Bluesky,
	},
];

export function Footer() {
	const { t } = useTranslation();

	return (
		<footer className="sticky top-[100vh] z-10 border-t border-t-primary bg-surface pt-3 lg:pl-72">
			<div className="mx-auto max-w-7xl px-6 pb-5 md:flex md:items-center md:justify-between lg:px-8">
				<div className="flex justify-center gap-x-6 md:order-2">
					{navigation.map((item) => (
						<a
							key={item.name}
							href={item.href}
							className="text-primary hover:text-gray-400"
						>
							<span className="sr-only">{item.name}</span>
							<item.icon className="size-6" aria-hidden="true" />
						</a>
					))}
				</div>
				<div>
					<p className="mt-8 text-left text-sm/6 text-primary md:order-1 md:mt-0">
						{t("footer.disclaimer")}
					</p>
					<p className="mt-8 text-left text-sm/6 text-primary md:order-1 md:mt-0">
						{t("footer.credits")}
					</p>
					<p className="mt-2 text-left text-xs/6 text-muted md:order-1 lg:hidden">
						{t("footer.version", { version: __APP_VERSION__ })}
					</p>
				</div>
			</div>
		</footer>
	);
}
