import { formatMoney } from "@fabkit/apps/pack-opener/lib/currency";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useTranslation } from "react-i18next";

/** A figure in the selected currency, or the words for not having one. A missing
 * price is normal, so it says so rather than showing a zero. */
export function PriceValue({ amount }: { amount: number | null }) {
	const { t } = useTranslation("pack-opener");
	const currency = usePackOpenerStore((state) => state.currency);
	return amount !== null
		? formatMoney(amount, currency)
		: t("page.price_unavailable");
}
