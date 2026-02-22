import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CardTypeField } from "../components/home/CardTypeField.tsx";
import { FeaturedArtist } from "../components/home/FeaturedArtist.tsx";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col justify-center items-center sm:pt-8 lg:pt-10">
			<div className="mx-auto max-w-2xl text-center">
				<h2 className="text-4xl font-semibold tracking-tight text-balance text-heading sm:text-5xl">
					{t("index.title")}
				</h2>
				<div className="mt-10 flex items-center justify-center gap-x-6 fade-in-fwd relative z-1">
					<CardTypeField />
				</div>
			</div>
			<div className="mt-10">
				<FeaturedArtist />
			</div>
		</div>
	);
}
