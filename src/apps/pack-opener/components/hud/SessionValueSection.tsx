import { PriceValue } from "@fabkit/apps/pack-opener/components/PriceValue";
import type { PriceReader } from "@fabkit/apps/pack-opener/lib/pricing";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";
import { computeValueTotals } from "@fabkit/apps/pack-opener/stats/value-totals";
import { useTranslation } from "react-i18next";

export function SessionValueSection({
	openedPacks,
	prices,
}: {
	openedPacks: OpenedPackRecord[];
	prices: PriceReader;
}) {
	const { t } = useTranslation("pack-opener");
	const totals = computeValueTotals(openedPacks, prices);

	return (
		<section className="space-y-1.5">
			<h3 className="font-semibold text-body">{t("stats.value_title")}</h3>
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted">{t("page.value_pulled_label")}</span>
				<span className="font-card-stat text-body">
					<PriceValue amount={totals.pulledValue} currency={prices.currency} />
				</span>
			</div>
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted">{t("stats.spent_label")}</span>
				<span className="font-card-stat text-body">
					<PriceValue amount={totals.spent} currency={prices.currency} />
				</span>
			</div>
			{totals.isPartial && (
				<p className="text-xs text-subtle">{t("page.partial_total_note")}</p>
			)}
		</section>
	);
}
