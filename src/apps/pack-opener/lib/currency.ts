/** USD prices are TCGplayer's and EUR are Cardmarket's; they are never converted. */
export type Currency = "USD" | "EUR";

const FORMATTERS: Record<Currency, Intl.NumberFormat> = {
	USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
	EUR: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }),
};

/** Formats in the currency's own locale ($12.50, 12,50 EUR), not the visitor's. */
export function formatMoney(amount: number, currency: Currency): string {
	return FORMATTERS[currency].format(amount);
}
