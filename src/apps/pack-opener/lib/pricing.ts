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
 * Every lookup returns null rather than a fallback in the other
 * currency. Showing a dollar figure to someone who asked for euros, or
 * silently converting one at today's rate, would make the number wrong in
 * a way the player cannot see, which is exactly what the whole sourcing
 * story in scripts/cardmarket.ts exists to avoid. "Not priced yet" is
 * honest. */

/** Translation key naming where this currency's prices came from. Both
 * marketplaces are always credited, per the same rule the pull rates
 * follow: a number on screen says where it is from. */
export function priceSourceKey(currency: Currency): string {
	return currency === "EUR" ? "dialog.price_source_cm" : "dialog.price_source";
}

/** The date a snapshot was captured, in the player's own locale. */
export function formatCapturedDate(capturedAt: string | null): string | null {
	return capturedAt
		? new Date(capturedAt).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: null;
}

/** Warms both snapshots for a set, settling once both have finished either
 * way. Deliberately both regardless of the current currency: switching the
 * toggle is a single click with no loading state of its own, and these are
 * small files fetched once per set. */
export async function warmPrices(setCode: string): Promise<void> {
	await Promise.allSettled([
		loadSetPrices(setCode),
		loadSetCardmarketPrices(setCode),
	]);
}

/** Every price lookup, bound to one currency and to one state of the price
 * caches. A component reads prices through this (see hooks/usePrices.ts),
 * because it gets a new identity whenever either changes, and anything computed
 * from it recomputes with it. `version` is what carries that second change. */
export interface PriceReader {
	currency: Currency;
	version: number;
	/** One pulled card's price, or null when this marketplace has none for it. */
	card(setCode: string | null, card: ResolvedCard): number | null;
	/** The sealed booster's own price, for "what this pack cost". */
	pack(setCode: string | null): number | null;
	box(setCode: string | null): number | null;
	/** When this marketplace's figures were captured, or null if its snapshot
	 * never loaded — every price a player sees is dated next to it, so the two
	 * have to come from the same source. */
	capturedAt(setCode: string | null): string | null;
}

export function createPriceReader(
	currency: Currency,
	version: number,
): PriceReader {
	function snapshot(setCode: string | null) {
		if (!setCode) return null;
		if (currency === "EUR") {
			const euro = getSetCardmarketPrices(setCode);
			return euro
				? {
						pack: euro.packPrice,
						box: euro.boxPrice,
						capturedAt: euro.capturedAt,
					}
				: null;
		}
		const dollar = getSetPrices(setCode);
		return dollar
			? {
					pack: dollar.packMarketPrice,
					box: dollar.boxMarketPrice,
					capturedAt: dollar.capturedAt,
				}
			: null;
	}

	return {
		currency,
		version,
		card(setCode, card) {
			if (!setCode) return null;
			return currency === "EUR"
				? getCardEuroPrice(setCode, card.printingId)
				: getCardPrice(setCode, card.tcgplayerProductId, card.treatment);
		},
		pack: (setCode) => snapshot(setCode)?.pack ?? null,
		box: (setCode) => snapshot(setCode)?.box ?? null,
		capturedAt: (setCode) => snapshot(setCode)?.capturedAt ?? null,
	};
}
