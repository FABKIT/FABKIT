import { BetaNotice } from "@fabkit/apps/pack-opener/components/BetaNotice";
import { SetCarousel } from "@fabkit/apps/pack-opener/components/carousel/SetCarousel";
import { CardLoadingIndicator } from "@fabkit/apps/pack-opener/components/hud/CardLoadingIndicator";
import { CardStepButton } from "@fabkit/apps/pack-opener/components/hud/CardStepButton";
import { PackSummary } from "@fabkit/apps/pack-opener/components/hud/PackSummary";
import { RevealCaption } from "@fabkit/apps/pack-opener/components/hud/RevealCaption";
import { PackOpenerCanvas } from "@fabkit/apps/pack-opener/components/scene/PackOpenerCanvas";
import { useCardBrowsing } from "@fabkit/apps/pack-opener/hooks/useCardBrowsing";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useTranslation } from "react-i18next";

/**
 * Set picker, canvas, caption slot, summary: all in flow at fixed heights except the
 * canvas, so it never changes size between phases. Only CardLoadingIndicator floats over
 * the card; from `md` up the card step buttons sit in the empty canvas at its sides.
 */
export function PackOpenerPage() {
	const { t } = useTranslation("pack-opener");
	const phase = usePackOpenerStore((state) => state.phase);
	const cardBrowsing = useCardBrowsing();

	// Phases showing a card, versus the pack.
	const showsCard = phase === "revealing" || phase === "done";

	return (
		<div className="relative flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden bg-surface lg:h-dvh">
			<h1 className="sr-only">{t("page.title")}</h1>
			<BetaNotice />
			{/* In flow above the canvas so the set picker can't sit on top of a card. */}
			<SetCarousel />
			{/* A size container, so the step buttons can be placed off the card's
			    width, which follows this box's height (the camera's field of view
			    is vertical). */}
			<div
				className="relative min-h-0 flex-1 [container-type:size]"
				{...cardBrowsing}
			>
				{/* Soft pool of light behind the card. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,var(--color-surface-muted),transparent_70%)]"
				/>
				<PackOpenerCanvas />
				<CardLoadingIndicator />
				{/* The card is 34cqh to each side of centre; the rest is the button
				    and a gap that clears the card's tilt. */}
				<CardStepButton
					offset={-1}
					className="absolute top-1/2 left-[max(0.5rem,calc(50%_-_34cqh_-_4.5rem))] hidden size-11 -translate-y-1/2 md:grid"
				/>
				<CardStepButton
					offset={1}
					className="absolute top-1/2 right-[max(0.5rem,calc(50%_-_34cqh_-_4.5rem))] hidden size-11 -translate-y-1/2 md:grid"
				/>
			</div>
			{/* One fixed height in every phase, so the canvas never resizes. */}
			<div className="flex h-19 shrink-0 items-center justify-center gap-2 px-4 text-center">
				{showsCard ? (
					<>
						<CardStepButton offset={-1} className="grid size-10 md:hidden" />
						<RevealCaption />
						<CardStepButton offset={1} className="grid size-10 md:hidden" />
					</>
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
