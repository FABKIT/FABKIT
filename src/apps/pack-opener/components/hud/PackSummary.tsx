import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { SessionStatsDialog } from "@fabkit/apps/pack-opener/components/hud/SessionStatsDialog";
import { formatUsd } from "@fabkit/apps/pack-opener/lib/currency";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { getCardPrice, getSetPrices } from "@fabkit/shared/data/fab-prices";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Minimum vertical drag, in pixels, before a touch gesture on the summary
 * header counts as a swipe rather than a tap — same threshold/pattern as
 * SetCarousel.tsx's horizontal swipe, just on the other axis. */
const SWIPE_THRESHOLD_PX = 40;

/** A finished pack resolves into an ordered, legible ledger — one row per
 * card, tappable to look at that specific card again in the 3D scene (see
 * stores/pack-opener.ts's revisitIndex, and RevealCaption.tsx's
 * "back to summary" affordance). Prices are USD market prices from the
 * build-time snapshot (see shared/data/fab-prices.ts); a card with no
 * available price shows a neutral dash, never a zero — see the execution
 * plan, sections 4.4 and 8.6.
 *
 * The ledger/breakdown collapses independently of the header (see
 * `expanded` below) — the execution plan, section 4.1: swipe or tap the
 * header on mobile, click it on desktop, click anywhere outside the panel
 * to collapse it. The header itself (title, pulled total, chevron) always
 * stays visible even collapsed, so the headline number is never hidden. */
export function PackSummary() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const packsOpenedThisSession = usePackOpenerStore(
		(state) => state.packsOpenedThisSession,
	);
	const openedPacksThisSession = usePackOpenerStore(
		(state) => state.openedPacksThisSession,
	);
	const openPack = usePackOpenerStore((state) => state.openPack);
	const revisitCard = usePackOpenerStore((state) => state.revisitCard);
	const [statsOpen, setStatsOpen] = useState(false);
	const [expanded, setExpanded] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const touchStartY = useRef<number | null>(null);

	const resolvedCards = useMemo(
		() =>
			pack?.map((card) =>
				activeCardResolver.resolve(card, packSetCode ?? undefined),
			) ?? [],
		[pack, packSetCode],
	);

	const cardPrices = useMemo(
		() =>
			resolvedCards.map((card) =>
				packSetCode
					? getCardPrice(packSetCode, card.tcgplayerProductId, card.treatment)
					: null,
			),
		[resolvedCards, packSetCode],
	);
	const knownPrices = cardPrices.filter(
		(price): price is number => price !== null,
	);
	const pulledTotal =
		knownPrices.length > 0
			? knownPrices.reduce((sum, price) => sum + price, 0)
			: null;
	const isPartialTotal =
		knownPrices.length > 0 && knownPrices.length < resolvedCards.length;
	const packPrice = packSetCode
		? (getSetPrices(packSetCode)?.packMarketPrice ?? null)
		: null;

	// Click/tap anywhere outside the panel collapses it — but not a click
	// landing inside some other dialog open on top of it (the pull-rates
	// dialog, the session-stats dialog), which portals outside this
	// component's own DOM subtree and would otherwise register as
	// "outside". Every Headless UI Dialog carries role="dialog" on its
	// root, so this check covers all of them generically rather than
	// tracking each one's own open state here.
	useEffect(() => {
		if (!expanded) return;
		function handlePointerDown(event: PointerEvent): void {
			if (!containerRef.current) return;
			const target = event.target as Node;
			if (containerRef.current.contains(target)) return;
			if (target instanceof Element && target.closest('[role="dialog"]')) {
				return;
			}
			setExpanded(false);
		}
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [expanded]);

	if (!pack) return null;

	return (
		<div
			ref={containerRef}
			className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-4 px-4"
		>
			<div className="flex w-full max-w-2xl flex-col rounded-2xl bg-surface/90 shadow-lg backdrop-blur">
				{/* The heading wraps the button (rather than sitting inside
				    it, which HTML doesn't allow — a <button> can only hold
				    phrasing content, not a heading) so the summary title
				    stays in the document outline for screen readers while
				    the whole header is still one native, keyboard-operable
				    toggle. Standard WAI-ARIA disclosure/accordion pattern. */}
				<h2 className="text-lg font-semibold text-heading">
					<button
						type="button"
						aria-expanded={expanded}
						onClick={() => setExpanded((value) => !value)}
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
							// synthesized click from also firing right after
							// this and toggling the state a second time.
							event.preventDefault();
							setExpanded(delta < 0);
						}}
						className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
					>
						<span>{t("page.summary_title")}</span>
						<span className="flex shrink-0 items-center gap-2">
							<span className="font-card-stat text-base text-body">
								{pulledTotal !== null
									? formatUsd(pulledTotal)
									: t("page.price_unavailable")}
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

				<div
					className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${
						expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
					}`}
				>
					<div className="overflow-hidden">
						<div className="px-4 pb-1">
							<ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
								{resolvedCards.map((card, index) => {
									const price = cardPrices[index];
									return (
										<li key={card.id}>
											<button
												type="button"
												onClick={() => revisitCard(index)}
												className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-border-primary hover:bg-surface-muted"
											>
												<img
													src={CardRarities[card.rarity].icon}
													alt={t(CardRarities[card.rarity].label)}
													className="h-5 w-5 shrink-0"
												/>
												<span className="font-card-name flex-1 truncate text-sm text-body">
													{card.name}
												</span>
												{card.rarity === "marvel" && (
													<span className="shrink-0 text-xs font-bold text-pack-marvel">
														{t("page.marvel_badge")}
													</span>
												)}
												{card.rarity !== "marvel" &&
													card.treatment !== "standard" && (
														<span className="shrink-0 text-xs font-bold text-pack-foil">
															{t(`page.treatment_name.${card.treatment}`)}
														</span>
													)}
												<span className="font-card-stat shrink-0 text-sm text-subtle">
													{price !== null
														? formatUsd(price)
														: t("page.price_unavailable")}
												</span>
											</button>
										</li>
									);
								})}
							</ul>
							<div className="mt-3 flex flex-col gap-1.5 border-t border-border-primary pt-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-heading">
										{t("page.value_pulled_label")}
									</span>
									<span className="font-card-stat text-base text-body">
										{pulledTotal !== null
											? formatUsd(pulledTotal)
											: t("page.price_unavailable")}
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
										{packPrice !== null
											? formatUsd(packPrice)
											: t("page.price_unavailable")}
									</span>
								</div>
							</div>
							<p className="mt-3 pb-3 text-center text-xs text-subtle">
								{t("page.packs_opened_session", {
									count: packsOpenedThisSession,
								})}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row">
				<button
					type="button"
					onClick={() => openPack()}
					className="rounded-full bg-heading px-6 py-3 font-semibold text-surface shadow-lg transition hover:opacity-90"
				>
					{t("page.open_another")}
				</button>
				{packsOpenedThisSession > 0 && (
					<button
						type="button"
						onClick={() => setStatsOpen(true)}
						className="rounded-full border border-primary bg-surface/80 px-6 py-3 font-semibold text-primary shadow-lg backdrop-blur transition-colors hover:bg-surface-active"
					>
						{t("stats.open_button")}
					</button>
				)}
			</div>

			<SessionStatsDialog
				open={statsOpen}
				onClose={() => setStatsOpen(false)}
				openedPacks={openedPacksThisSession}
			/>
		</div>
	);
}
