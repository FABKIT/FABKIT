import { SetCarousel } from "@fabkit/apps/pack-opener/components/carousel/SetCarousel";
import { IdleOverlay } from "@fabkit/apps/pack-opener/components/hud/IdleOverlay";
import { PackSummary } from "@fabkit/apps/pack-opener/components/hud/PackSummary";
import { RevealCaption } from "@fabkit/apps/pack-opener/components/hud/RevealCaption";
import { PackOpenerCanvas } from "@fabkit/apps/pack-opener/components/scene/PackOpenerCanvas";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useTranslation } from "react-i18next";

/**
 * Stacked top to bottom: set picker, the 3D canvas, a caption slot, then the
 * pack summary. Everything except the canvas is in normal flow at a fixed
 * height, so the canvas — and therefore whatever it frames — never changes
 * size as the phases move on. Nothing floats over the canvas at all.
 *
 * The caption slot is one fixed-height box shared by the idle prompt and the
 * card's details, so the pack and the cards are each framed in a canvas of a
 * predictable height. The summary's space is reserved from the first reveal
 * rather than appearing at the end, because otherwise the canvas would
 * shrink at that moment and the last card would visibly shrink with it; its
 * ledger opens upward over the canvas (see PackSummary.tsx) for the same
 * reason.
 */
export function PackOpenerPage() {
	const { t } = useTranslation("pack-opener");
	const phase = usePackOpenerStore((state) => state.phase);

	// The two phases showing a card, versus the two showing the pack.
	const showsCard = phase === "revealing" || phase === "done";

	return (
		<div className="relative flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden bg-surface lg:h-dvh">
			<h1 className="sr-only">{t("page.title")}</h1>
			{/* In flow above the canvas, not floating over it — the canvas below
			    takes whatever height is left, so the set picker can never sit on
			    top of a card. */}
			<SetCarousel />
			<div className="relative min-h-0 flex-1">
				{/* Desk-lamp glow behind the card — reads as a soft pool of light
				    in both themes, and keeps a flat surface color from looking
				    like a bug behind the unlit 3D card. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(ellipse 60% 50% at 50% 45%, var(--color-surface-muted), transparent 70%)",
					}}
				/>
				<PackOpenerCanvas />
			</div>
			{/* One slot, one height, whichever phase is running. Its height is
			    fixed here rather than by the components inside it so the two can
			    never drift apart and resize the canvas between phases. */}
			<div className="flex h-19 shrink-0 items-center justify-center px-4 text-center">
				{showsCard ? <RevealCaption /> : <IdleOverlay />}
			</div>
			{showsCard && (
				<div
					className={phase === "done" ? undefined : "invisible"}
					aria-hidden={phase !== "done"}
				>
					<PackSummary />
				</div>
			)}
		</div>
	);
}
