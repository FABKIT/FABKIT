import { PackLedger } from "@fabkit/apps/pack-opener/components/hud/PackLedger";
import { SessionControls } from "@fabkit/apps/pack-opener/components/hud/SessionControls";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

/** The row under the card. The ledger, its header bar and "Next Pack" only
 * exist once a pack is finished; the session controls beside them are there in
 * every phase. Having to finish a pack before you could change currency or
 * look at your totals was an artefact of them sharing this component, not a
 * decision. The slot's height is reserved by PackOpenerPage.tsx either way, so
 * nothing moves as they come and go. */
export function PackSummary() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const phase = usePackOpenerStore((state) => state.phase);
	const readyAnotherPack = usePackOpenerStore(
		(state) => state.readyAnotherPack,
	);
	const panelRef = useRef<HTMLDivElement>(null);

	const finishedPack = phase === "done" ? pack : null;

	return (
		<div className="pointer-events-auto flex shrink-0 flex-col items-center px-4 pb-2">
			{/* The whole frame: ledger, header bar and both actions, on ONE row
			    from `md` up so the finished-pack chrome costs the canvas as
			    little height as possible — the canvas is a fixed height in
			    every phase (see PackOpenerPage.tsx), so every pixel saved here
			    goes straight to the card. Below `md` there is not room for
			    that, so it wraps and the actions sit under the bar.

			    It is also what the ledger's `bottom-full` anchors to, so the
			    ledger spans the full row. */}
			<div
				ref={panelRef}
				className={`relative flex w-full max-w-4xl flex-col items-stretch gap-2 md:flex-row md:items-center ${
					// With no bar to push them along the row, the controls
					// centre themselves under the card instead of hugging its
					// left edge.
					finishedPack ? "" : "md:justify-center"
				}`}
			>
				{finishedPack && <PackLedger pack={finishedPack} panelRef={panelRef} />}

				{/* Below md the actions share the row width and shrink to fit
				    rather than wrapping onto a third line: wrapping made the
				    reserved slot taller on the narrowest phones only, which would
				    have needed its own height stop. That is also why the two
				    session controls are icon-only squares rather than labelled
				    buttons — four labelled buttons cannot sit on one phone-width
				    row, and their labels live in the tooltip and the accessible
				    name instead. Above md they all take their natural width
				    beside the bar. */}
				<div className="flex w-full shrink-0 justify-center gap-2 md:w-auto">
					{finishedPack && (
						<button
							type="button"
							onClick={() => readyAnotherPack()}
							className="min-w-0 flex-1 truncate rounded-full bg-heading px-4 py-2.5 text-sm font-semibold text-surface shadow-lg transition hover:opacity-90 md:flex-none md:px-6 md:text-base"
						>
							{t("page.open_another")}
						</button>
					)}
					<SessionControls />
				</div>
			</div>
		</div>
	);
}
