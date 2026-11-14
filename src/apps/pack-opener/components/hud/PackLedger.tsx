import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { PackLedgerRow } from "@fabkit/apps/pack-opener/components/hud/PackLedgerRow";
import { PriceProvenance } from "@fabkit/apps/pack-opener/components/PriceProvenance";
import { PriceValue } from "@fabkit/apps/pack-opener/components/PriceValue";
import { SWIPE_THRESHOLD_PX } from "@fabkit/apps/pack-opener/config/scene";
import { useCollapseOnOutsidePointer } from "@fabkit/apps/pack-opener/hooks/useCollapseOnOutsidePointer";
import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import { sumKnown } from "@fabkit/apps/pack-opener/stats/value-totals";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { ChevronDown } from "lucide-react";
import { type RefObject, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface PackLedgerProps {
	pack: DrawnCard[];
	panelRef: RefObject<HTMLDivElement | null>;
}

/** One row per card of a finished pack; tapping a row revisits that card in the scene.
 * Mounted only for a finished pack, so each new pack starts open. `panelRef` is the whole
 * summary row, so clicking the neighbouring actions doesn't collapse the ledger. */
export function PackLedger({ pack, panelRef }: PackLedgerProps) {
	const { t } = useTranslation("pack-opener");
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const packsOpened = usePackOpenerStore(
		(state) => state.openedPacksThisSession.length,
	);
	const revisitCard = usePackOpenerStore((state) => state.revisitCard);
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const prices = usePrices();
	const [expanded, setExpanded] = useState(true);
	const touchStartY = useRef<number | null>(null);
	const ledgerId = useId();

	useCollapseOnOutsidePointer(panelRef, expanded, () => setExpanded(false));

	/** Shows the tapped card and collapses the ledger. Reopening it keeps that card. */
	function showCard(index: number): void {
		revisitCard(index);
		setExpanded(false);
	}

	const resolvedCards = pack.map((card) => resolveCard(card, packSetCode));
	const cardPrices = resolvedCards.map((card) =>
		prices.card(packSetCode, card),
	);
	const { total: pulledTotal, isPartial: isPartialTotal } =
		sumKnown(cardPrices);

	return (
		<>
			{/* Opens upward over the canvas so the card never changes size. */}
			<div className="absolute inset-x-0 bottom-full">
				<div
					className={`grid w-full transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${
						expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
					}`}
				>
					{/* inert while collapsed, so Tab can't reach the clipped rows. */}
					<div id={ledgerId} inert={!expanded} className="overflow-hidden">
						{/* Near-opaque so card art behind it doesn't bleed through. */}
						<div className="rounded-t-2xl border border-b-0 border-border-primary bg-surface/95 px-4 pt-4 shadow-xl backdrop-blur-md">
							<ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
								{resolvedCards.map((card, index) => (
									<PackLedgerRow
										key={card.id}
										card={card}
										price={cardPrices[index]}
										isShowing={revisitIndex === index}
										onSelect={() => showCard(index)}
									/>
								))}
							</ul>
							<div className="mt-3 flex flex-col gap-1.5 border-t border-border-primary pt-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-heading">
										{t("page.value_pulled_label")}
									</span>
									<span className="font-card-stat text-base text-body">
										<PriceValue amount={pulledTotal} />
									</span>
								</div>
								{isPartialTotal && (
									<p className="text-right text-xs text-subtle">
										{t("page.partial_total_note")}
									</p>
								)}
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted">
										{t("page.pack_price_label")}
									</span>
									<span className="font-card-stat text-sm text-muted">
										<PriceValue amount={prices.pack(packSetCode)} />
									</span>
								</div>
								<PriceProvenance setCode={packSetCode} className="text-right" />
							</div>
							<p className="mt-3 pb-4 text-center text-xs text-subtle">
								{t("page.packs_opened_session", { count: packsOpened })}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Squared off at the top while open, to read as one panel with the ledger. */}
			<div
				className={`min-w-0 flex-1 border border-border-primary bg-surface/95 shadow-xl backdrop-blur-md ${
					expanded ? "rounded-b-2xl border-t-0" : "rounded-2xl"
				}`}
			>
				{/* The heading wraps the button so the title stays in the document outline. */}
				<h2 className="text-lg font-semibold text-heading">
					<button
						type="button"
						aria-expanded={expanded}
						aria-controls={ledgerId}
						onClick={() => setExpanded(!expanded)}
						onTouchStart={(event) => {
							touchStartY.current = event.touches[0].clientY;
						}}
						onTouchEnd={(event) => {
							if (touchStartY.current === null) return;
							const delta =
								event.changedTouches[0].clientY - touchStartY.current;
							touchStartY.current = null;
							if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
							// Stop the synthesized click from toggling a second time.
							event.preventDefault();
							setExpanded(delta < 0);
						}}
						className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left"
					>
						<span className="truncate">{t("page.summary_title")}</span>
						<span className="flex shrink-0 items-center gap-2">
							<span className="font-card-stat text-base text-body">
								<PriceValue amount={pulledTotal} />
							</span>
							<ChevronDown
								className={`h-5 w-5 text-muted transition-transform ${
									expanded ? "rotate-180" : ""
								}`}
								aria-hidden="true"
							/>
						</span>
					</button>
				</h2>
			</div>
		</>
	);
}
