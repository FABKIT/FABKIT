import { SetCarousel } from "@fabkit/apps/pack-opener/components/carousel/SetCarousel";
import { PackOpenerHUD } from "@fabkit/apps/pack-opener/components/hud/PackOpenerHUD";
import { PackSummary } from "@fabkit/apps/pack-opener/components/hud/PackSummary";
import { RevealCaption } from "@fabkit/apps/pack-opener/components/hud/RevealCaption";
import { PackOpenerCanvas } from "@fabkit/apps/pack-opener/components/scene/PackOpenerCanvas";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useTranslation } from "react-i18next";

/**
 * Stacked top to bottom: set picker, the 3D canvas, the current card's
 * details, then the pack summary. Everything except the canvas is in normal
 * flow at a fixed height, so the canvas (and therefore the card's size on
 * screen) is identical from the first reveal through to the summary — see
 * DONE_CAMERA_POSITION's own note on why one card size matters.
 *
 * That is also why the summary keeps its space reserved during the reveal
 * rather than appearing from nowhere at the end: if it only took up room
 * once the pack finished, the canvas would shrink at that moment and the
 * last card would visibly shrink with it. The summary's ledger opens
 * *upward* over the canvas (see PackSummary.tsx) rather than pushing, for
 * the same reason.
 */
export function PackOpenerPage() {
	const { t } = useTranslation("pack-opener");
	const phase = usePackOpenerStore((state) => state.phase);

	// The two phases where a card (rather than the pack) is on screen.
	const showsCard = phase === "revealing" || phase === "done";

	return (
		<div className="relative flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden bg-surface lg:h-dvh">
			<h1 className="sr-only">{t("page.title")}</h1>
			{/* In flow above the canvas, not floating over it — the canvas
			    below takes whatever height is left, so the set picker can
			    never sit on top of a card. */}
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
				<PackOpenerHUD />
			</div>
			{/* Always describes whichever card is actually on screen, including
			    the one being revisited from the ledger, and always sits above
			    the summary rather than being replaced by it. */}
			{showsCard && <RevealCaption />}
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
