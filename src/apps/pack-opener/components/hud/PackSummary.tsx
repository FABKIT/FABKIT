import { PackLedger } from "@fabkit/apps/pack-opener/components/hud/PackLedger";
import { SessionControls } from "@fabkit/apps/pack-opener/components/hud/SessionControls";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

/** The row under the card. The ledger and "Next Pack" only exist once a pack is
 * finished; the session controls show in every phase. */
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
			{/* One row from `md` up, to cost the canvas as little height as possible. The
			    ledger's `bottom-full` anchors to this. */}
			<div
				ref={panelRef}
				className={`relative flex w-full max-w-4xl flex-col items-stretch gap-2 md:flex-row md:items-center ${
					// Centre the controls when there is no bar.
					finishedPack ? "" : "md:justify-center"
				}`}
			>
				{finishedPack && <PackLedger pack={finishedPack} panelRef={panelRef} />}

				{/* Below md the actions shrink to fit one row; the session controls are icon-only. */}
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
