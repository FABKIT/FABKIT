import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { PriceRow } from "@fabkit/apps/pack-opener/components/PriceRow";
import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";
import { computeValueTotals } from "@fabkit/apps/pack-opener/stats/value-totals";
import { useTranslation } from "react-i18next";

export function SessionValueSection({
	openedPacks,
}: {
	openedPacks: OpenedPackRecord[];
}) {
	const { t } = useTranslation("pack-opener");
	const prices = usePrices();
	const totals = computeValueTotals(openedPacks, prices, resolveCard);

	return (
		<section className="space-y-1.5">
			<h3 className="font-semibold text-body">{t("stats.value_title")}</h3>
			<PriceRow
				label={t("page.value_pulled_label")}
				amount={totals.pulledValue}
			/>
			<PriceRow label={t("stats.spent_label")} amount={totals.spent} />
			{totals.isPartial && (
				<p className="text-xs text-subtle">{t("page.partial_total_note")}</p>
			)}
		</section>
	);
}
