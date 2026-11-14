import { BetaNotice } from "@fabkit/apps/pack-opener/components/BetaNotice";
import { SetCarousel } from "@fabkit/apps/pack-opener/components/carousel/SetCarousel";
import { CardLoadingIndicator } from "@fabkit/apps/pack-opener/components/hud/CardLoadingIndicator";
import { PackSummary } from "@fabkit/apps/pack-opener/components/hud/PackSummary";
import { RevealCaption } from "@fabkit/apps/pack-opener/components/hud/RevealCaption";
import { PackOpenerCanvas } from "@fabkit/apps/pack-opener/components/scene/PackOpenerCanvas";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useTranslation } from "react-i18next";

/**
 * Set picker, canvas, caption slot, summary: all in flow at fixed heights except the
 * canvas, so it never changes size between phases. Only CardLoadingIndicator floats over it.
 */
export function PackOpenerPage() {
	const { t } = useTranslation("pack-opener");
	const phase = usePackOpenerStore((state) => state.phase);

	// Phases showing a card, versus the pack.
	const showsCard = phase === "revealing" || phase === "done";

	return (
		<div className="relative flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden bg-surface lg:h-dvh">
			<h1 className="sr-only">{t("page.title")}</h1>
			<BetaNotice />
			{/* In flow above the canvas so the set picker can't sit on top of a card. */}
			<SetCarousel />
			<div className="relative min-h-0 flex-1">
				{/* Soft pool of light behind the card. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,var(--color-surface-muted),transparent_70%)]"
				/>
				<PackOpenerCanvas />
				<CardLoadingIndicator />
			</div>
			{/* One fixed height in every phase, so the canvas never resizes. */}
			<div className="flex h-19 shrink-0 items-center justify-center px-4 text-center">
				{showsCard ? (
					<RevealCaption />
				) : (
					<p className="animate-pulse text-lg font-medium text-heading drop-shadow">
						{t("page.tap_to_tear")}
					</p>
				)}
			</div>
			{/* Space for the summary is reserved in every phase so the canvas never resizes.
			    The two heights are its measured natural height below and above `md`;
			    re-measure them if PackSummary's chrome changes. */}
			<div className="h-[107px] shrink-0 md:h-[57px]">
				<PackSummary />
			</div>
		</div>
	);
}
