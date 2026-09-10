import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { SessionStatsDialog } from "@fabkit/apps/pack-opener/components/hud/SessionStatsDialog";
import { SWIPE_THRESHOLD_PX } from "@fabkit/apps/pack-opener/config/scene";
import { formatUsd } from "@fabkit/apps/pack-opener/lib/currency";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { getCardPrice, getSetPrices } from "@fabkit/shared/data/fab-prices";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const phase = usePackOpenerStore((state) => state.phase);
	const [statsOpen, setStatsOpen] = useState(false);
	const [expandedByChoice, setExpandedByChoice] = useState(true);
	const panelRef = useRef<HTMLDivElement>(null);
	const touchStartY = useRef<number | null>(null);

	// Tapping a row collapses the panel out of the way so the chosen card is
	// visible at its normal size. Which card is on screen and whether the
	// ledger is open are otherwise independent of each other: reopening the
	// ledger deliberately does NOT put the last-revealed card back, because
	// then you could never open the ledger to pick a different card without
	// losing the one you were looking at. The chosen card stays until
	// another row is tapped or a new pack is opened.
	const expanded = expandedByChoice;

	/** Tapping a row: show that card and get the ledger out of the way. */
	function showCard(index: number): void {
		revisitCard(index);
		setExpandedByChoice(false);
	}

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
	const setPrices = packSetCode ? getSetPrices(packSetCode) : null;
	const packPrice = setPrices?.packMarketPrice ?? null;
	const capturedDate = setPrices
		? new Date(setPrices.capturedAt).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: null;

	// Every new pack starts with its ledger open again.
	//
	// This used to happen for free: the summary was mounted only while a
	// card was on screen, so it was destroyed and rebuilt between packs and
	// its state went back to the default. It now stays mounted in every
	// phase, because its space has to stay reserved or the canvas resizes
	// and the scene stutters (see PackOpenerPage.tsx). That made collapsing
	// it sticky: once shut, it stayed shut for every later pack, so the
	// summary never appeared on its own after the last card again.
	// `pack` is a fresh array per openPack(), so it identifies the pack.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pack is the trigger, not a value read here — a new array means a new pack, which reopens the ledger.
	useEffect(() => {
		setExpandedByChoice(true);
	}, [pack]);

	// Click/tap anywhere outside the panel collapses it — but not a click
	// landing inside some other dialog open on top of it (the pull-rates
	// dialog, the session-stats dialog), which portals outside this
	// component's own DOM subtree and would otherwise register as
	// "outside". Every Headless UI Dialog carries role="dialog" on its
	// root, so this check covers all of them generically rather than
	// tracking each one's own open state here.
	//
	// This measures against panelRef — the visible frame itself — and NOT
	// the outer wrapper. The wrapper is full-width and centres its
	// children, so clicks to the left or right of the frame (and on the
	// action buttons below it) were landing inside the wrapper and
	// counting as "inside": only clicks above, on the canvas, actually
	// collapsed it.
	useEffect(() => {
		if (!expanded || phase !== "done") return;
		function handlePointerDown(event: PointerEvent): void {
			if (!panelRef.current) return;
			const target = event.target as Node;
			if (panelRef.current.contains(target)) return;
			if (target instanceof Element && target.closest('[role="dialog"]')) {
				return;
			}
			setExpandedByChoice(false);
		}
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [expanded, phase]);

	if (!pack) return null;

	return (
		<div className="pointer-events-auto flex shrink-0 flex-col items-center px-4 pb-2">
			{/* The whole frame: ledger, header bar and both actions, on ONE row
			    from `sm` up so the finished-pack chrome costs the canvas as
			    little height as possible — the canvas is a fixed height in
			    every phase (see PackOpenerPage.tsx), so every pixel saved here
			    goes straight to the card. Below `sm` there is not room for
			    that, so it wraps and the actions sit under the bar.

			    panelRef is on this row rather than on the bar alone, so the
			    actions count as INSIDE the panel: clicking "Session stats" no
			    longer collapses the summary on its way to opening the dialog,
			    which was a side effect of the previous arrangement rather than
			    anything anyone asked for. Clicking anywhere genuinely outside
			    the frame still collapses it. It is also what the ledger's
			    `bottom-full` anchors to, so the ledger spans the full row. */}
			<div
				ref={panelRef}
				className="relative flex w-full max-w-4xl flex-col items-stretch gap-2 md:flex-row md:items-center"
			>
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
						<div className="overflow-hidden">
							{/* Near-opaque on purpose: the card behind it is full size
						    for the whole done phase, so a lightly tinted panel let
						    bright card art bleed through and made prices hard to
						    read. */}
							<div className="rounded-t-2xl border border-b-0 border-border-primary bg-surface/95 px-4 pt-4 shadow-xl backdrop-blur-md">
								<ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
									{resolvedCards.map((card, index) => {
										const price = cardPrices[index];
										const isShowing = revisitIndex === index;
										return (
											<li key={card.id}>
												{/* The row whose card is currently on screen stays
											    marked, so reopening the ledger shows at a
											    glance which one you were looking at. */}
												<button
													type="button"
													onClick={() => showCard(index)}
													className={`flex w-full items-center gap-3 rounded-lg border px-2 py-1.5 text-left transition hover:border-border-primary hover:bg-surface-muted ${
														isShowing
															? "border-border-primary bg-surface-active"
															: "border-transparent"
													}`}
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
									{/* Same provenance the pull-rates dialog carries, on the
								    same two translation keys rather than a second copy
								    of the wording: every money figure a player sees
								    should say where it came from and how old it is, not
								    only the ones inside a dialog they had to go looking
								    for. */}
									{capturedDate && (
										<p className="text-right text-xs text-subtle">
											{t("dialog.price_captured", { date: capturedDate })}
										</p>
									)}
									<p className="text-right text-xs text-subtle">
										{t("dialog.price_source")}
									</p>
								</div>
								<p className="mt-3 pb-4 text-center text-xs text-subtle">
									{t("page.packs_opened_session", {
										count: packsOpenedThisSession,
									})}
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
							onClick={() => setExpandedByChoice(!expanded)}
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
								setExpandedByChoice(delta < 0);
							}}
							className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left"
						>
							<span className="truncate">{t("page.summary_title")}</span>
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
				</div>

				{/* Below md the two actions share the row width and shrink to fit
				    rather than wrapping onto a third line: wrapping made the
				    reserved slot taller on the narrowest phones only, which would
				    have needed its own height stop. Above md they take their
				    natural width beside the bar. */}
				<div className="flex w-full shrink-0 justify-center gap-2 md:w-auto">
					<button
						type="button"
						onClick={() => openPack()}
						className="min-w-0 flex-1 truncate rounded-full bg-heading px-4 py-2.5 text-sm font-semibold text-surface shadow-lg transition hover:opacity-90 md:flex-none md:px-6 md:text-base"
					>
						{t("page.open_another")}
					</button>
					{/* Fills with the brand colour and flips the label white on
				    hover, matching the pull-rates button. It previously only
				    shifted its background, leaving the label washing into it. */}
					{packsOpenedThisSession > 0 && (
						<button
							type="button"
							onClick={() => setStatsOpen(true)}
							className="min-w-0 flex-1 truncate rounded-full border border-primary bg-surface/80 px-4 py-2.5 text-sm font-semibold text-primary shadow-lg backdrop-blur transition-colors hover:bg-primary hover:text-white md:flex-none md:px-6 md:text-base"
						>
							{t("stats.open_button")}
						</button>
					)}
				</div>
			</div>

			<SessionStatsDialog
				open={statsOpen}
				onClose={() => setStatsOpen(false)}
				openedPacks={openedPacksThisSession}
			/>
		</div>
	);
}
