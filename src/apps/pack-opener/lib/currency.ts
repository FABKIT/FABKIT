/** The two marketplaces this app can show prices from. Not a display
 * preference over one set of numbers: USD prices come from TCGplayer and
 * EUR prices from Cardmarket, and the two genuinely disagree about what a
 * card is worth, which is the point of letting a player pick. Nothing here
 * ever converts between them — see lib/pricing.ts and
 * shared/data/fab-prices-cm.ts. */
export type Currency = "USD" | "EUR";

const FORMATTERS: Record<Currency, Intl.NumberFormat> = {
	USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
	EUR: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }),
};

/** Formats a figure in the currency it was actually sourced in. Both
 * formatters are pinned to a locale of that currency's own market rather
 * than the visitor's, so a price reads the way it does where it was
 * quoted: $12.50 and 12,50 €. */
export function formatMoney(amount: number, currency: Currency): string {
	return FORMATTERS[currency].format(amount);
}
