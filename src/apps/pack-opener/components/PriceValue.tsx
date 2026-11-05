import {
	type Currency,
	formatMoney,
} from "@fabkit/apps/pack-opener/lib/currency";
import { useTranslation } from "react-i18next";

/** A figure, or the words for not having one. A missing price is normal, so it
 * says so rather than showing a zero. */
export function PriceValue({
	amount,
	currency,
}: {
	amount: number | null;
	currency: Currency;
}) {
	const { t } = useTranslation("pack-opener");
	return amount !== null
		? formatMoney(amount, currency)
		: t("page.price_unavailable");
}
