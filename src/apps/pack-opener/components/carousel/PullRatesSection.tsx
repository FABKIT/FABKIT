import {
	PERCENT_DISPLAY_THRESHOLD,
	percentOfPack,
	pullRateRows,
} from "@fabkit/apps/pack-opener/pack/pull-rates";
import type { PackConfig } from "@fabkit/apps/pack-opener/pack/types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useTranslation } from "react-i18next";

/** Derived from the same expectedRarityCounts SessionStatsDialog.tsx compares
 * actual pulls against, so a player can never see two different numbers
 * claiming to be the same rate. */
export function PullRatesSection({ config }: { config: PackConfig }) {
	const { t } = useTranslation("pack-opener");

	return (
		<section className="space-y-2">
			<h3 className="font-semibold text-body">
				{t("dialog.pull_rates_title")}
			</h3>
			<ul className="space-y-1.5 text-sm">
				{pullRateRows(config).map((row) => {
					const percent = percentOfPack(row, config);
					return (
						<li key={row.rarity} className="flex items-center gap-2">
							<img
								src={CardRarities[row.rarity].icon}
								alt=""
								className="h-4 w-4 shrink-0"
							/>
							<span className="flex-1 text-body">
								{t(CardRarities[row.rarity].label)}
							</span>
							<span className="font-card-stat shrink-0 text-xs text-subtle">
								{percent >= PERCENT_DISPLAY_THRESHOLD
									? `${percent.toFixed(1)}%`
									: t("dialog.rate_odds", {
											odds: Math.round(1 / row.expectedPerPack),
										})}
							</span>
						</li>
					);
				})}
			</ul>
			{config.coldFoilChance > 0 && (
				<p className="text-xs text-subtle">
					{t("dialog.cold_foil_note", {
						odds: Math.round(1 / config.coldFoilChance),
					})}
				</p>
			)}
		</section>
	);
}
