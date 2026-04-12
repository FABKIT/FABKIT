import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { currentWorkItems, futurePlans } from "../config/roadmap";
import "../styles/roadmap.css";
import type * as React from "react";

export const Route = createFileRoute("/roadmap")({
	component: RoadmapPage,
});

type Priority = "high" | "medium" | "low";
type Status = "completed" | "in-progress" | "planned" | "idea";

interface RoadmapItem {
	title: string;
	description: string;
	status: Status;
	priority: Priority;
	icon: React.ComponentType<{ className?: string }>;
}

function sortByPriorityAndTitle(items: RoadmapItem[]): RoadmapItem[] {
	const priorityOrder: Record<Priority, number> = {
		high: 1,
		medium: 2,
		low: 3,
	};

	return [...items].sort((a, b) => {
		const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
		if (priorityDiff !== 0) return priorityDiff;
		return a.title.localeCompare(b.title);
	});
}

function getStatusColor(status: Status): string {
	switch (status) {
		case "completed":
			return "text-heading bg-primary border-primary";
		case "in-progress":
			return "text-heading bg-secondary border-secondary";
		case "planned":
			return "text-heading bg-tertiary border-tertiary";
		case "idea":
			return "text-idea bg-idea-light border-idea-light";
		default:
			return "text-heading bg-primary border-primary";
	}
}

function getPriorityColor(priority: Priority): string {
	switch (priority) {
		case "high":
			return "bg-secondary-dark text-secondary-light border-secondary-light";
		case "medium":
			return "bg-tertiary-dark text-tertiary-light border-tertiary-light";
		case "low":
			return "bg-primary-dark text-primary-light border-primary-light";
		default:
			return "bg-primary-dark text-primary-light border-primary-light";
	}
}

const sortedCurrentWorkItems = sortByPriorityAndTitle(
	currentWorkItems as RoadmapItem[],
);
const sortedFuturePlans = sortByPriorityAndTitle(futurePlans as RoadmapItem[]);

function RoadmapPage() {
	const { t } = useTranslation();

	return (
		<>
			{/* Header */}
			<div className="border-b border-border-primary bg-surface">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="py-8">
						<h1 className="text-3xl font-bold text-heading">
							{t("roadmap.title")}
						</h1>
						<p className="mt-2 text-muted">{t("roadmap.subtitle")}</p>
					</div>
				</div>
			</div>

			{/* Timeline Animation */}
			<div className="relative w-full overflow-hidden bg-surface-muted">
				<div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
					<div className="flex h-30 w-full items-center justify-center overflow-hidden py-8">
						<div className="relative h-20 w-[90%] max-w-[800px]">
							<svg
								className="absolute inset-0 h-full w-full"
								viewBox="0 0 800 80"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="Timeline animation"
							>
								<path
									className="sine-wave"
									d="M0,40 C44.4,40 44.4,20 88.9,20 C133.3,20 133.3,40 177.8,40 C222.2,40 222.2,60 266.7,60 C311.1,60 311.1,40 355.6,40 C400,40 400,20 444.4,20 C488.9,20 488.9,40 533.3,40 C577.8,40 577.8,60 622.2,60 C666.7,60 666.7,40 711.1,40 C755.6,40 755.6,20 800,20"
									id="sine-path"
								/>
								<path
									d="M0,32 C44.4,32 44.4,12 88.9,12 C133.3,12 133.3,32 177.8,32 C222.2,32 222.2,52 266.7,52 C311.1,52 311.1,32 355.6,32 C400,32 400,12 444.4,12 C488.9,12 488.9,32 533.3,32 C577.8,32 577.8,52 622.2,52 C666.7,52 666.7,32 711.1,32 C755.6,32 755.6,12 800,12"
									id="circle-path"
									fill="none"
									stroke="none"
								/>
								<circle className="timeline-dot" r="6">
									<animateMotion dur="4s" begin="3s" repeatCount="indefinite">
										<mpath href="#circle-path" />
									</animateMotion>
								</circle>
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Top row: Two main boards */}
				<div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* Currently Working On Board */}
					<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
						<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
							<h2 className="flex items-center gap-2 text-xl font-semibold text-heading">
								<Clock className="h-5 w-5" />
								{t("roadmap.current_work_title")}
							</h2>
							<p className="mt-1 text-sm text-muted">
								{t("roadmap.current_work_description")}
							</p>
						</div>
						<div className="space-y-4 p-6">
							{sortedCurrentWorkItems.map((item) => (
								<div
									key={item.title}
									className="rounded-lg border border-border-primary bg-surface p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="mb-2 flex items-center gap-2">
												<item.icon className="h-4 w-4 text-primary" />
												<h3 className="font-medium text-heading">
													{item.title}
												</h3>
											</div>
											<p className="mb-3 text-sm text-body">
												{item.description}
											</p>
											<div className="flex items-center gap-2">
												<span
													className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}
												>
													{item.status.replace("-", " ")}
												</span>
												<span
													className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getPriorityColor(item.priority)}`}
												>
													{item.priority} {t("roadmap.priority")}
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Future Plans Board */}
					<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
						<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
							<h2 className="flex items-center gap-2 text-xl font-semibold text-heading">
								<Lightbulb className="h-5 w-5" />
								{t("roadmap.future_plans_title")}
							</h2>
							<p className="mt-1 text-sm text-muted">
								{t("roadmap.future_plans_description")}
							</p>
						</div>
						<div className="space-y-4 p-6">
							{sortedFuturePlans.map((item) => (
								<div
									key={item.title}
									className="rounded-lg border border-border-primary bg-surface p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="mb-2 flex items-center gap-2">
												<item.icon className="h-4 w-4 text-primary" />
												<h3 className="font-medium text-heading">
													{item.title}
												</h3>
											</div>
											<p className="mb-3 text-sm text-body">
												{item.description}
											</p>
											<div className="flex items-center gap-2">
												<span
													className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}
												>
													{item.status}
												</span>
												<span
													className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getPriorityColor(item.priority)}`}
												>
													{item.priority} {t("roadmap.priority")}
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Bottom row: Support sections */}
				<div className="space-y-8">
					{/* Ko-fi Section */}
					<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
						<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
							<h2 className="text-xl font-semibold text-heading">
								{t("roadmap.support_title")}
							</h2>
							<p className="mt-1 text-sm text-muted">
								{t("roadmap.support_description")}
							</p>
						</div>
						<div className="p-6">
							<iframe
								id="kofiframe"
								src="https://ko-fi.com/fabkit/?hidefeed=true&widget=true&embed=true&preview=true"
								style={{
									border: "none",
									width: "100%",
									padding: "4px",
									background: "#f9f9f9",
								}}
								height="575"
								title="fabkit"
							/>
						</div>
					</div>

					{/* Suggestions Section */}
					<div className="rounded-lg border border-border-primary bg-primary/10 p-6">
						<h3 className="mb-2 text-lg font-semibold text-heading">
							{t("roadmap.suggestions_title")}
						</h3>
						<p className="mb-4 text-muted">{t("roadmap.suggestions_text")}</p>
						<Link
							to="/contact"
							className="inline-flex items-center rounded-md border-2 border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-primary/90"
						>
							{t("roadmap.get_in_touch")}
						</Link>
					</div>
				</div>
			</div>
		</>
	);
}
