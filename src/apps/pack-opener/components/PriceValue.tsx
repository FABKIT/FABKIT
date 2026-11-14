import { formatMoney } from "@fabkit/apps/pack-opener/lib/currency";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useTranslation } from "react-i18next";

/** A figure in the selected currency, or "Not priced yet" when there is none. */
export function PriceValue({ amount }: { amount: number | null }) {
	const { t } = useTranslation("pack-opener");
	const currency = usePackOpenerStore((state) => state.currency);
	return amount !== null
		? formatMoney(amount, currency)
		: t("page.price_unavailable");
}
