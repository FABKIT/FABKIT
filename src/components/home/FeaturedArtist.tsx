import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Contact from "../../config/contact.ts";
import { featuredArtists } from "../../config/featured_artist.tsx";

export function FeaturedArtist() {
	const { t } = useTranslation();
	const [currentSlide, setCurrentSlide] = useState(0);
	const featuredArtist =
		featuredArtists[Math.floor(Math.random() * featuredArtists.length)];

	const nextSlide = useCallback(() => {
		setCurrentSlide((prev) => (prev + 1) % featuredArtist.images.length);
	}, [featuredArtist.images.length]);

	const prevSlide = useCallback(() => {
		setCurrentSlide(
			(prev) =>
				(prev - 1 + featuredArtist.images.length) %
				featuredArtist.images.length,
		);
	}, [featuredArtist.images.length]);

	useEffect(() => {
		const intervalId = setInterval(nextSlide, 7000);
		return () => clearInterval(intervalId);
	}, [nextSlide]);

	return (
		<div className="mx-auto max-w-[1600px] overflow-hidden rounded-lg border-2 border-border-primary bg-surface/50 shadow-lg backdrop-blur-sm">
			<div className="flex flex-col items-start gap-6 p-6 lg:gap-8 xl:flex-row">
				{/* Left side: Image slideshow with header on mobile/tablet */}
				<div className="flex w-full flex-col gap-4 xl:w-auto">
					{/* Featured Artist header - shows above card on mobile/tablet */}
					<div className="space-y-2 text-center xl:hidden">
						<div className="inline-flex items-center gap-2 text-sm font-semibold text-heading">
							<Star className="h-5 w-5" />
							<span>{t("components.featured_artist.label")}</span>
						</div>
						<h3 className="text-2xl font-bold text-heading">
							{featuredArtist.name}
						</h3>
						<p className="text-sm italic text-muted">
							"{featuredArtist.collection}"
						</p>
					</div>

					<div className="flex items-center justify-center gap-3">
						<button
							type="button"
							aria-label={t("components.featured_artist.previous_slide")}
							className="shrink-0 rounded-full border-2 border-border-primary bg-surface p-2 shadow-lg transition-transform hover:scale-110"
							onClick={prevSlide}
						>
							<ChevronLeft className="h-6 w-6 text-primary" />
						</button>

						<div className="relative aspect-[450/628] w-full max-w-[450px] overflow-hidden rounded-lg lg:w-[450px]">
							{featuredArtist.images.map((image, index) => (
								<img
									key={image}
									src={image}
									alt={`${t("components.featured_artist.card_alt")} ${index + 1}`}
									className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
									style={{ opacity: currentSlide === index ? 1 : 0 }}
								/>
							))}
						</div>

						<button
							type="button"
							aria-label={t("components.featured_artist.next_slide")}
							className="shrink-0 rounded-full border-2 border-border-primary bg-surface p-2 shadow-lg transition-transform hover:scale-110"
							onClick={nextSlide}
						>
							<ChevronRight className="h-6 w-6 text-primary" />
						</button>
					</div>

					<div className="flex justify-center gap-2">
						{featuredArtist.images.map((image, index) => (
							<button
								key={image}
								type="button"
								aria-label={`${t("components.featured_artist.go_to_slide")} ${index + 1}`}
								className={`h-2 rounded-full transition-all ${
									currentSlide === index
										? "w-6 bg-primary"
										: "w-2 bg-gray-400 hover:bg-gray-500"
								}`}
								onClick={() => setCurrentSlide(index)}
							/>
						))}
					</div>
				</div>

				{/* Right side: Description */}
				<div className="flex flex-col justify-center space-y-4 xl:min-w-0 xl:flex-1">
					<div className="hidden space-y-2 xl:block">
						<div className="inline-flex items-center gap-2 text-sm font-semibold text-heading">
							<Star className="h-5 w-5" />
							<span>{t("components.featured_artist.label")}</span>
						</div>
						<h3 className="text-2xl font-bold text-heading">
							{featuredArtist.name}
						</h3>
						<p className="text-sm italic text-muted">
							"{featuredArtist.collection}"
						</p>
					</div>

					<div className="space-y-4 text-body leading-relaxed">
						{featuredArtist.description}
					</div>

					<div className="space-y-2 pt-2">
						<a
							href="https://discord.com/invite/vMRMdqJc4V"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 text-sm font-semibold text-heading hover:underline"
						>
							{t("components.featured_artist.fab_discord_link")}
							<ArrowRight className="h-4 w-4" />
						</a>
					</div>
					<div>
						<a
							href={Contact.DiscordInvite}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 text-sm font-semibold text-heading hover:underline"
						>
							{t("components.featured_artist.our_discord_link")}
							<ArrowRight className="h-4 w-4" />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
