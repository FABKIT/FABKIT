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
		<div className="relative isolate overflow-hidden min-h-screen w-full">
			<div className="flex flex-col justify-center items-center sm:pt-8 lg:pt-10">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-4xl font-semibold tracking-tight text-balance text-heading sm:text-5xl">
						{t("index.title")}
					</h2>
					<div className="mt-10 flex items-center justify-center gap-x-6 fade-in-fwd relative z-1">
						<CardTypeField />
					</div>
				</div>
				<div className="mt-10 mb-5 mx-auto xl:mx-24 fade-in-fwd">
					<FeaturedArtist />
				</div>
			</div>

			{/* Legacy-matching radial gradient bubble */}
			<svg
				aria-hidden="true"
				viewBox="0 0 1024 1024"
				className="absolute top-1/2 left-1/2 -z-10 size-[64rem] -translate-x-1/2 fade-in-bottom"
				style={{
					maskImage: "radial-gradient(closest-side, white, transparent)",
				}}
			>
				<circle
					cx="512"
					cy="512"
					r="512"
					fill="url(#gradient-home)"
					fillOpacity="0.7"
				/>
				<defs>
					<radialGradient id="gradient-home">
						<stop stopColor="#A6864A" />
						<stop offset="1" stopColor="#A6864A" />
					</radialGradient>
				</defs>
			</svg>
		</div>
	);
}
