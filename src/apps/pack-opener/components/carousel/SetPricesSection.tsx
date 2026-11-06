import { CurrencyToggle } from "@fabkit/apps/pack-opener/components/CurrencyToggle";
import { PriceProvenance } from "@fabkit/apps/pack-opener/components/PriceProvenance";
import { PriceRow } from "@fabkit/apps/pack-opener/components/PriceRow";
import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import { useTranslation } from "react-i18next";

/** Prices come from the build-time snapshots (see shared/data/fab-prices.ts and
 * fab-prices-cm.ts) and read "Not priced yet" when unavailable: a set the build
 * never resolved a price source for, or whose snapshot hasn't loaded yet.
 *
 * Carries its own currency switch so the figures can be changed right where
 * they are being read, with the dialog covering the one on the summary bar. It
 * writes the same single store preference rather than a second one of its own. */
export function SetPricesSection({ setCode }: { setCode: string }) {
	const { t } = useTranslation("pack-opener");
	const prices = usePrices();

	return (
		<section className="space-y-1.5">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold text-body">{t("dialog.price_title")}</h3>
				<CurrencyToggle variant="dialog" />
			</div>
			<PriceRow
				label={t("dialog.pack_price_label")}
				amount={prices.pack(setCode)}
			/>
			<PriceRow
				label={t("dialog.box_price_label")}
				amount={prices.box(setCode)}
			/>
			<PriceProvenance setCode={setCode} />
		</section>
	);
}
