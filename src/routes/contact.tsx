import Contact from "@fabkit/platform/config/contact.ts";
import { Bluesky } from "@fabkit/platform/components/icons/Bluesky";
import { Discord } from "@fabkit/platform/components/icons/Discord";
import { Github } from "@fabkit/platform/components/icons/Github";
import { KoFi } from "@fabkit/platform/components/icons/KoFi";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/contact")({
	component: ContactPage,
});

const contactLinks = [
	{
		name: "contact.links_github_name",
		description: "contact.links_github_description",
		href: Contact.Repository,
		icon: Github,
	},
	{
		name: "contact.links_discord_name",
		description: "contact.links_discord_description",
		href: Contact.DiscordInvite,
		icon: Discord,
	},
	{
		name: "contact.links_bluesky_name",
		description: "contact.links_bluesky_description",
		href: Contact.Bluesky,
		icon: Bluesky,
	},
	{
		name: "contact.links_kofi_name",
		description: "contact.links_kofi_description",
		href: Contact.KoFi,
		icon: KoFi,
	},
];

const teamMembers = [
	{
		name: "@Thencros",
		role: "contact.team_thencros_role",
		description: "contact.team_thencros_description",
		avatar: "/img/Thencros.svg",
	},
	{
		name: "@Lambstream",
		role: "contact.team_lambstream_role",
		description: "contact.team_lambstream_description",
		avatar: "/img/Lambstream.svg",
	},
	{
		name: "@Dealloc",
		role: "contact.team_dealloc_role",
		description: "contact.team_dealloc_description",
		avatar: "/img/Dealloc.svg",
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
	{
		name: "DaLekXIV",
		description: "Feature contributor in FABKIT V1",
	},
];

const supporters = ["SalisburyBavo"];

function ContactPage() {
	const { t } = useTranslation("platform");

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
								<p>{t("contact.about_paragraph_1")}</p>
								<p>{t("contact.about_paragraph_2")}</p>
								<p>{t("contact.about_paragraph_3")}</p>
								<p>
									{t("contact.about_paragraph_4_intro")}{" "}
									<a
										href="https://ko-fi.com/fabkit"
										className="text-primary underline"
									>
										{t("contact.about_paragraph_4_support")}
									</a>{" "}
									{t("contact.about_paragraph_4_outro")}
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
													{member.name}
												</h3>
												<p className="text-muted">{t(member.role)}</p>
												<p className="mt-1 text-sm text-subtle">
													{t(member.description)}
												</p>
											</div>
										</div>
										<div className="mt-3 text-right">
											<p className="text-xs text-faint">
												{t("contact.team_avatar_credit")}
											</p>
										</div>
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
							<div className="space-y-2 p-4">
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
							<div className="p-4">
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
