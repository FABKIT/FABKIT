import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { SessionStatsDialog } from "@fabkit/apps/pack-opener/components/hud/SessionStatsDialog";
import { formatUsd } from "@fabkit/apps/pack-opener/lib/currency";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { getCardPrice, getSetPrices } from "@fabkit/shared/data/fab-prices";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/** A finished pack resolves into an ordered, legible ledger — one row per
 * card, tappable to look at that specific card again in the 3D scene (see
 * stores/pack-opener.ts's revisitIndex, and RevealCaption.tsx's
 * "back to summary" affordance). Prices are USD market prices from the
 * build-time snapshot (see shared/data/fab-prices.ts); a card with no
 * available price shows a neutral dash, never a zero — see the execution
 * plan, sections 4.4 and 8.6. */
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

	if (!pack) return null;

	return (
		<div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-4 px-4">
			<div className="flex w-full max-w-2xl flex-col rounded-2xl bg-surface/90 p-4 shadow-lg backdrop-blur">
				<h2 className="mb-3 text-center text-lg font-semibold text-heading">
					{t("page.summary_title")}
				</h2>
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
									<span className="font-card-stat shrink-0 text-xs text-subtle">
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
						<span className="font-card-stat text-sm text-body">
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
				<div className="mt-3 flex items-center justify-center gap-2">
					<p className="text-xs text-subtle">
						{t("page.packs_opened_session", { count: packsOpenedThisSession })}
					</p>
					{packsOpenedThisSession > 0 && (
						<>
							<span className="text-xs text-subtle">·</span>
							<button
								type="button"
								onClick={() => setStatsOpen(true)}
								className="text-xs font-semibold text-heading underline-offset-2 hover:underline"
							>
								{t("stats.open_button")}
							</button>
						</>
					)}
				</div>
			</div>
			<button
				type="button"
				onClick={() => openPack()}
				className="rounded-full bg-heading px-6 py-3 font-semibold text-surface shadow-lg transition hover:opacity-90"
			>
				{t("page.open_another")}
			</button>
			<SessionStatsDialog
				open={statsOpen}
				onClose={() => setStatsOpen(false)}
				openedPacks={openedPacksThisSession}
			/>
		</div>
	);
}
