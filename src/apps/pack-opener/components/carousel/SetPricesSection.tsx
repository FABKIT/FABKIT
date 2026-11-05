import { CurrencyToggle } from "@fabkit/apps/pack-opener/components/CurrencyToggle";
import { PriceValue } from "@fabkit/apps/pack-opener/components/PriceValue";
import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import {
	formatCapturedDate,
	priceSourceKey,
} from "@fabkit/apps/pack-opener/lib/pricing";
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
	const capturedDate = formatCapturedDate(prices.capturedAt(setCode));

	return (
		<section className="space-y-1.5">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold text-body">{t("dialog.price_title")}</h3>
				<CurrencyToggle variant="dialog" />
			</div>
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted">{t("dialog.pack_price_label")}</span>
				<span className="font-card-stat text-body">
					<PriceValue
						amount={prices.pack(setCode)}
						currency={prices.currency}
					/>
				</span>
			</div>
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted">{t("dialog.box_price_label")}</span>
				<span className="font-card-stat text-body">
					<PriceValue amount={prices.box(setCode)} currency={prices.currency} />
				</span>
			</div>
			{capturedDate && (
				<p className="text-xs text-subtle">
					{t("dialog.price_captured", { date: capturedDate })}
				</p>
			)}
			{/* Says where the money numbers actually come from. Players
			    reasonably want to know a price is a real market figure and not
			    something this app invented. */}
			<p className="text-xs text-subtle">
				{t(priceSourceKey(prices.currency))}
			</p>
		</section>
	);
}
