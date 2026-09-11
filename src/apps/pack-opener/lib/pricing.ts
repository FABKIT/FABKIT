import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import type { Currency } from "@fabkit/apps/pack-opener/lib/currency";
import {
	getCardPrice,
	getSetPrices,
	loadSetPrices,
} from "@fabkit/shared/data/fab-prices";
import {
	getCardEuroPrice,
	getSetCardmarketPrices,
	loadSetCardmarketPrices,
} from "@fabkit/shared/data/fab-prices-cm";

/** The one place the app asks "what does this cost", so every price
 * surface (the pack ledger, the session totals, the set info dialog) reads
 * the same marketplace for the same setting and none of them has to know
 * that the two snapshots are keyed differently.
 *
 * Every function here returns null rather than a fallback in the other
 * currency. Showing a dollar figure to someone who asked for euros, or
 * silently converting one at today's rate, would make the number wrong in
 * a way the player cannot see, which is exactly what the whole sourcing
 * story in scripts/cardmarket.ts exists to avoid. A dash is honest. */

/** One pulled card's price, or null when this marketplace has none for it. */
export function cardPrice(
	currency: Currency,
	setCode: string | null,
	card: ResolvedCard,
): number | null {
	if (!setCode) return null;
	return currency === "EUR"
		? getCardEuroPrice(setCode, card.printingId)
		: getCardPrice(setCode, card.tcgplayerProductId, card.treatment);
}

/** The sealed booster's own price, for "what this pack cost". */
export function packPrice(
	currency: Currency,
	setCode: string | null,
): number | null {
	if (!setCode) return null;
	return currency === "EUR"
		? (getSetCardmarketPrices(setCode)?.packPrice ?? null)
		: (getSetPrices(setCode)?.packMarketPrice ?? null);
}

export function boxPrice(
	currency: Currency,
	setCode: string | null,
): number | null {
	if (!setCode) return null;
	return currency === "EUR"
		? (getSetCardmarketPrices(setCode)?.boxPrice ?? null)
		: (getSetPrices(setCode)?.boxMarketPrice ?? null);
}

/** When this marketplace's figures were captured, or null if its snapshot
 * never loaded — every price a player sees is dated next to it, so the two
 * have to come from the same source. */
export function priceCapturedAt(
	currency: Currency,
	setCode: string | null,
): string | null {
	if (!setCode) return null;
	return currency === "EUR"
		? (getSetCardmarketPrices(setCode)?.capturedAt ?? null)
		: (getSetPrices(setCode)?.capturedAt ?? null);
}

/** Translation key naming where this currency's prices came from. Both
 * marketplaces are always credited, per the same rule the pull rates
 * follow: a number on screen says where it is from. */
export function priceSourceKey(currency: Currency): string {
	return currency === "EUR" ? "dialog.price_source_cm" : "dialog.price_source";
}

/** Warms both snapshots for a set. Deliberately both regardless of the
 * current currency: switching the toggle is a single click with no loading
 * state of its own, and these are small files fetched once per set. */
export function warmPrices(setCode: string): void {
	loadSetPrices(setCode).catch(() => {});
	loadSetCardmarketPrices(setCode).catch(() => {});
}
