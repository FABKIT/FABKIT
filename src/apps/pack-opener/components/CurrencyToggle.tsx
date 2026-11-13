import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { DollarSign, Euro } from "lucide-react";
import { useTranslation } from "react-i18next";

const VARIANTS = {
	bar: {
		button:
			"grid size-11 shrink-0 place-items-center rounded-full border border-primary bg-surface/80 text-primary shadow-lg backdrop-blur transition-colors hover:bg-primary hover:text-white",
		icon: "size-5",
	},
	dialog: {
		button:
			"grid size-8 shrink-0 place-items-center rounded-full border border-primary text-primary transition-colors hover:bg-primary hover:text-white",
		icon: "size-4",
	},
};

/** One button carrying the currency that is ON, which flips to the other when
 * pressed — the marketplace the prices around it came from, in one glyph. */
export function CurrencyToggle({
	variant,
}: {
	variant: keyof typeof VARIANTS;
}) {
	const { t } = useTranslation("pack-opener");
	const currency = usePackOpenerStore((state) => state.currency);
	const setCurrency = usePackOpenerStore((state) => state.setCurrency);
	const label = t(`currency.switch_to_${currency === "USD" ? "eur" : "usd"}`);
	const Icon = currency === "USD" ? DollarSign : Euro;

	return (
		<button
			type="button"
			onClick={() => setCurrency(currency === "USD" ? "EUR" : "USD")}
			aria-label={label}
			title={label}
			className={VARIANTS[variant].button}
		>
			<Icon className={VARIANTS[variant].icon} aria-hidden="true" />
		</button>
	);
}
