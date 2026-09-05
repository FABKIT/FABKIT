import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function PackSummary() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const packsOpenedThisSession = usePackOpenerStore(
		(state) => state.packsOpenedThisSession,
	);
	const openPack = usePackOpenerStore((state) => state.openPack);

	const resolvedCards = useMemo(
		() => pack?.map((card) => activeCardResolver.resolve(card)) ?? [],
		[pack],
	);

	if (!pack) return null;

	return (
		<div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-4 px-4">
			<div className="w-full max-w-2xl rounded-2xl bg-surface/90 p-4 shadow-lg backdrop-blur">
				<h2 className="mb-3 text-center text-lg font-semibold text-heading">
					{t("page.summary_title")}
				</h2>
				<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
					{resolvedCards.map((card) => (
						<div
							key={card.id}
							className="flex flex-col items-center gap-1 rounded-lg border border-border-primary bg-surface-muted p-2"
							title={card.name}
						>
							<img
								src={CardRarities[card.rarity].icon}
								alt={t(CardRarities[card.rarity].label)}
								className="h-6 w-6"
							/>
							{card.marvel && (
								<span className="text-[10px] font-bold text-fuchsia-400">
									{t("page.marvel_badge")}
								</span>
							)}
							{!card.marvel && card.foil && (
								<span className="text-[10px] font-bold text-sky-400">
									{t("page.foil_badge")}
								</span>
							)}
						</div>
					))}
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
