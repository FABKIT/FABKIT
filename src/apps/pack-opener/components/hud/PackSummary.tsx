import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/** A finished pack resolves into an ordered, legible ledger — one row per
 * card, tappable to look at that specific card again in the 3D scene (see
 * stores/pack-opener.ts's revisitIndex, and RevealCaption.tsx's
 * "back to summary" affordance). Prices show a placeholder honestly rather
 * than a fake number: the price snapshot pipeline is a later step in the
 * execution plan (section 4.6/commit 10), not built yet. */
export function PackSummary() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const packsOpenedThisSession = usePackOpenerStore(
		(state) => state.packsOpenedThisSession,
	);
	const openPack = usePackOpenerStore((state) => state.openPack);
	const revisitCard = usePackOpenerStore((state) => state.revisitCard);

	const resolvedCards = useMemo(
		() => pack?.map((card) => activeCardResolver.resolve(card)) ?? [],
		[pack],
	);

	if (!pack) return null;

	return (
		<div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-4 px-4">
			<div className="flex w-full max-w-2xl flex-col rounded-2xl bg-surface/90 p-4 shadow-lg backdrop-blur">
				<h2 className="mb-3 text-center text-lg font-semibold text-heading">
					{t("page.summary_title")}
				</h2>
				<ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
					{resolvedCards.map((card, index) => (
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
								{card.rarity !== "marvel" && card.treatment !== "standard" && (
									<span className="shrink-0 text-xs font-bold text-pack-foil">
										{t(`page.treatment_name.${card.treatment}`)}
									</span>
								)}
								<span className="shrink-0 text-xs text-subtle">
									{t("page.price_unavailable")}
								</span>
							</button>
						</li>
					))}
				</ul>
				<div className="mt-3 flex items-center justify-between border-t border-border-primary pt-3">
					<span className="text-sm font-semibold text-heading">
						{t("page.pack_total_label")}
					</span>
					<span className="text-sm text-subtle">
						{t("page.pack_total_pending")}
					</span>
				</div>
				<p className="mt-3 text-center text-xs text-subtle">
					{t("page.packs_opened_session", { count: packsOpenedThisSession })}
				</p>
			</div>
			<button
				type="button"
				onClick={() => openPack()}
				className="rounded-full bg-heading px-6 py-3 font-semibold text-surface shadow-lg transition hover:opacity-90"
			>
				{t("page.open_another")}
			</button>
		</div>
	);
}
