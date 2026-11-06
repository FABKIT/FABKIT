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

/** A finished pack resolves into an ordered, legible ledger — one row per
 * card, tappable to look at that specific card again in the 3D scene (see
 * stores/pack-opener.ts's revisitIndex). Prices come from whichever
 * marketplace the currency switch is on (see lib/pricing.ts): TCGplayer
 * dollars or Cardmarket euros, never one converted into the other. A card
 * that marketplace has no price for says "Not priced yet", never a zero.
 *
 * The ledger collapses independently of its header: swipe or tap the header
 * on mobile, click it on desktop, click anywhere outside the panel to collapse
 * it. The header itself (title, pulled total, chevron) always stays visible
 * even collapsed, so the headline number is never hidden.
 *
 * Mounted only while a finished pack is showing, which is also what opens the
 * ledger for every new pack: the next one mounts a fresh component, starting
 * open, and resolves its cards after the pack is complete rather than while
 * the tear was still under way.
 *
 * `panelRef` is the whole row including the actions beside this (see
 * PackSummary.tsx), so clicking "Session stats" doesn't collapse the summary
 * on its way to opening the dialog. It measures the visible frame rather than
 * the outer wrapper because the wrapper is full-width and centres its
 * children: clicks to the left or right of the frame would land inside it and
 * count as "inside". */
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

	/** Tapping a row shows that card and gets the ledger out of the way, so
	 * the chosen card is visible at its normal size. Which card is on screen
	 * and whether the ledger is open are otherwise independent of each other:
	 * reopening the ledger deliberately does NOT put the last-revealed card
	 * back, because then you could never open the ledger to pick a different
	 * card without losing the one you were looking at. The chosen card stays
	 * until another row is tapped or a new pack is opened. */
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
			{/* The ledger opens UPWARD, over the canvas, rather than pushing the
			    layout around — that is what keeps the card exactly one size
			    whether the summary is open or shut (see PackOpenerPage.tsx).
			    Collapsed it has no height at all: the border and background sit
			    on the inner element so nothing shows as a stray line above the
			    header. */}
			<div className="absolute inset-x-0 bottom-full">
				<div
					className={`grid w-full transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${
						expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
					}`}
				>
					{/* inert while collapsed: clipped to zero height, its rows are
					    invisible but would otherwise stay reachable by Tab. */}
					<div id={ledgerId} inert={!expanded} className="overflow-hidden">
						{/* Near-opaque on purpose: the card behind it is full size
						    for the whole done phase, so a lightly tinted panel let
						    bright card art bleed through and made prices hard to
						    read. */}
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

			{/* The header bar itself stays in flow, directly under the card's
			    details, so it never covers the card. Squared off at the top
			    while open so it reads as one panel with the ledger above. */}
			<div
				className={`min-w-0 flex-1 border border-border-primary bg-surface/95 shadow-xl backdrop-blur-md ${
					expanded ? "rounded-b-2xl border-t-0" : "rounded-2xl"
				}`}
			>
				{/* The heading wraps the button (rather than sitting inside it,
				    which HTML doesn't allow — a <button> can only hold phrasing
				    content, not a heading) so the summary title stays in the
				    document outline for screen readers while the whole header is
				    still one native, keyboard-operable toggle. Standard
				    WAI-ARIA disclosure/accordion pattern. */}
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
							// A real swipe, not a tap — stop the browser's own
							// synthesized click from also firing right after this
							// and toggling the state a second time.
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
