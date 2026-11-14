import type { SessionStats } from "@fabkit/apps/pack-opener/stats/session-stats";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useTranslation } from "react-i18next";

export function SetRaritySection({
	stats,
	setName,
}: {
	stats: SessionStats["bySet"][number];
	setName: string;
}) {
	const { t } = useTranslation("pack-opener");

	return (
		<section className="space-y-2">
			<h3 className="font-semibold text-body">{setName}</h3>
			<p className="text-xs text-subtle">
				{t("stats.packs_opened_for_set", { count: stats.packsOpened })}
			</p>
			<ul className="space-y-1 text-sm">
				{stats.rarities.map((rarity) => (
					<li key={rarity.rarity} className="flex items-center gap-2">
						<img
							src={CardRarities[rarity.rarity].icon}
							alt=""
							className="h-4 w-4 shrink-0"
						/>
						<span className="flex-1 text-body">
							{t(CardRarities[rarity.rarity].label)}
						</span>
						<span className="font-card-stat shrink-0 text-xs text-subtle">
							{rarity.expectedPercent !== null
								? t("stats.pull_line_with_expected", {
										pulled: rarity.pulled,
										percent: rarity.pulledPercent.toFixed(0),
										expected: rarity.expectedPercent.toFixed(0),
									})
								: t("stats.pull_line", {
										pulled: rarity.pulled,
										percent: rarity.pulledPercent.toFixed(0),
									})}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
