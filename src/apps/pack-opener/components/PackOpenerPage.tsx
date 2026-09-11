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
			{/* Always present, always the same height, in every phase — the
			    summary is only ever VISIBLE once a pack is finished, but its
			    space is reserved from the very first frame.

			    This used to be mounted only during the card phases, and that
			    was the last real source of stutter in this screen. Mounting it
			    took 112px away from the canvas at the exact moment the first
			    card arrived, and unmounting it gave 112px back the moment
			    "Open Another Pack" was pressed. The canvas measured 669px tall
			    while the pack was on screen and 557px once the summary
			    appeared. A canvas that resizes reflows a frame later than the
			    scene inside it draws, so the pack and the first card were each
			    painted once at the previous size before snapping to the right
			    one. That is what read as an old, smaller copy appearing and
			    being replaced.

			    The height is fixed here rather than left to the content, for
			    the same reason the caption slot above is: the two must never
			    drift apart and resize the canvas between phases. Both values
			    are the summary's measured natural height, and there are
			    exactly two because the actions move onto the bar's own row at
			    `md` (see PackSummary.tsx). Measured 57px at 768 and above,
			    107px from 320 to 767. Re-measure these if that component's
			    chrome changes: a slot shorter than its content clips the
			    buttons, a taller one is dead space taken from the card.

			    The slot used to be `invisible` in every phase but `done`,
			    which hid the session controls (currency, session stats,
			    reset) along with the pack summary they happen to sit beside.
			    Those are about the session rather than the finished pack, so
			    PackSummary decides for itself what to show in which phase
			    now, and this slot simply stays visible. Its height does not
			    change either way, so the canvas still never resizes. */}
			<div className="h-[107px] shrink-0 md:h-[57px]">
				<PackSummary />
			</div>
		</div>
	);
}
