import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Discord } from "../components/icons/Discord.tsx";
import { Github } from "../components/icons/Github.tsx";
import Contact from "../config/contact.ts";

export const Route = createFileRoute("/contact")({
	component: ContactPage,
});

const contactLinks = [
	{
		name: "GitHub Repository",
		description: "contact.links_github_description",
		href: Contact.Repository,
		icon: Github,
	},
	{
		name: "Discord Community",
		description: "contact.links_discord_description",
		href: Contact.DiscordInvite,
		icon: Discord,
	},
];

const teamMembers = [
	{
		name: "@Thencros",
		role: "UI/UX Designer, Creative Director",
		description: "Product concept, graphic design & UI development",
		avatar: "/img/Thencros.svg",
		avatarCredit: "Avatar by Diana Johanna Velasquez",
	},
	{
		name: "@Lambstream",
		role: "Lead Developer",
		description: "Frontend development & application architecture",
		avatar: "/img/Lambstream.svg",
		avatarCredit: "Avatar by Diana Johanna Velasquez",
	},
];

const specialMentions = [
	{
		name: "Animoose",
		description: "Creator of FabCustomCardCreator.com, a huge inspiration!",
	},
	{
		name: "SalisburyBavo",
		description: "Beta tester in the early stages of FABKIT",
	},
];

const supporters = ["SalisburyBavo"];

function ContactPage() {
	const { t } = useTranslation();

	return (
		<>
			{/* Header */}
			<div className="border-b border-border-primary bg-surface">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="py-8">
						<h1 className="text-3xl font-bold text-heading">
							{t("contact.title")}
						</h1>
						<p className="mt-2 text-muted">{t("contact.sub_title")}</p>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* Left Column */}
					<div className="space-y-8">
						{/* Get in Touch */}
						<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
							<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
								<h2 className="text-xl font-semibold text-heading">
									{t("contact.get_in_touch")}
								</h2>
								<p className="mt-1 text-sm text-muted">
									{t("contact.get_in_touch_description")}
								</p>
							</div>
							<div className="space-y-4 p-6">
								{contactLinks.map((link) => (
									<a
										key={link.name}
										href={link.href}
										target="_blank"
										rel="noreferrer"
										className="group flex items-center gap-4 rounded-lg border-2 border-border-primary p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface-muted"
									>
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
											<link.icon className="h-6 w-6 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-heading">
												{t(link.name)}
											</h3>
											<p className="text-sm text-muted">
												{t(link.description)}
											</p>
										</div>
									</a>
								))}
							</div>
						</div>

						{/* About Section */}
						<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
							<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
								<h2 className="text-xl font-semibold text-heading">
									{t("contact.about_title")}
								</h2>
							</div>
							<div className="space-y-4 p-6 text-body leading-relaxed">
								<p>
									Our goal is simple: creating high-quality tools for the Flesh
									and Blood TCG community. As passionate FaB players ourselves,
									we saw opportunities to build meaningful tools for fellow
									enthusiasts.
								</p>
								<p>
									Our current flagship tool is the Custom Card Creator. We've
									invested considerable effort into making sure our tool
									generates cards that look as close to real Flesh and Blood
									cards as possible – complete with official fonts, proper
									symbols, and meticulously crafted templates.
								</p>
								<p>
									We believe these great tools should be accessible to everyone,
									which is why FABKIT runs entirely in your browser without
									requiring downloads. Our commitment to the community extends
									to making the platform open source, allowing players to
									contribute and help shape our future.
								</p>
								<p>
									This project is a labor of love that we actively develop in
									our spare time, driven purely by our passion for the game.
									We're not sponsored or backed by anyone, we're just some
									friends who wanted to build something awesome for fellow
									players. However, any{" "}
									<a
										href="https://ko-fi.com/fabkit"
										className="text-primary underline"
									>
										support
									</a>{" "}
									will help us dedicate more time to bringing new features to
									life and keeping everything free for the community.
								</p>
							</div>
						</div>
					</div>

					{/* Right Column */}
					<div className="space-y-8">
						{/* Our Team */}
						<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
							<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
								<h2 className="text-xl font-semibold text-heading">
									{t("contact.team_title")}
								</h2>
								<p className="mt-1 text-sm text-muted">
									{t("contact.team_description")}
								</p>
							</div>
							<div className="space-y-6 p-6">
								{teamMembers.map((member) => (
									<div
										key={member.name}
										className="rounded-lg border border-border-primary bg-surface-muted p-6"
									>
										<div className="flex items-center gap-6">
											<div className="relative flex h-24 w-24 items-center justify-center">
												<img src={member.avatar} alt={member.name} />
											</div>
											<div>
												<h3 className="text-lg font-semibold text-heading">
													{t(member.name)}
												</h3>
												<p className="text-muted">{t(member.role)}</p>
												<p className="mt-1 text-sm text-subtle">
													{t(member.description)}
												</p>
											</div>
										</div>
										{member.avatarCredit && (
											<div className="mt-3 text-right">
												<p className="text-xs text-faint">
													{t(member.avatarCredit)}
												</p>
											</div>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Special Mentions */}
						<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
							<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
								<h2 className="text-xl font-semibold text-heading">
									{t("contact.special_mentions_title")}
								</h2>
							</div>
							<div className="max-h-32 space-y-2 overflow-y-auto p-4">
								{specialMentions.map((mention) => (
									<div
										key={mention.name}
										className="rounded bg-surface-muted p-3 text-sm text-body"
									>
										<span className="font-semibold text-heading">
											{mention.name}
										</span>
										<span className="text-subtle">
											{" "}
											- {mention.description}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Ko-Fi Supporters */}
						<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
							<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
								<h2 className="text-xl font-semibold text-heading">
									{t("contact.supporters_title")}
								</h2>
							</div>
							<div className="max-h-32 overflow-y-auto p-4">
								{supporters.map((supporter) => (
									<div
										key={supporter}
										className="mb-2 rounded bg-surface-muted p-3 text-sm text-body"
									>
										<span className="font-medium">{supporter}</span>
									</div>
								))}
								<div className="py-4 text-center text-xs italic text-subtle">
									{t("contact.supporters_subtext")}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
