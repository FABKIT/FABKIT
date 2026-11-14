import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import {
	formatCapturedDate,
	priceSourceKey,
} from "@fabkit/apps/pack-opener/lib/pricing";
import { useTranslation } from "react-i18next";

/** Where a set's prices came from and how old they are. Every money figure a
 * player sees should say so, because players reasonably want to know a price is
 * a real market figure and not something this app invented. Returns siblings so
 * the parent's own spacing applies to each line. */
export function PriceProvenance({
	setCode,
	className = "",
}: {
	setCode: string | null;
	className?: string;
}) {
	const { t } = useTranslation("pack-opener");
	const prices = usePrices();
	const capturedDate = formatCapturedDate(prices.capturedAt(setCode));
	const lineClassName = `text-xs text-subtle ${className}`;

	return (
		<>
			{capturedDate && (
				<p className={lineClassName}>
					{t("dialog.price_captured", { date: capturedDate })}
				</p>
			)}
			<p className={lineClassName}>{t(priceSourceKey(prices.currency))}</p>
		</>
	);
}
