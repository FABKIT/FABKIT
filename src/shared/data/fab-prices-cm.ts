import { createCachedJsonLoader } from "@fabkit/shared/data/cached-json-loader";

/** One set's Cardmarket price snapshot (EUR), keyed by the printing's uniqueId.
 * Never converted from USD: a euro figure is a real Cardmarket price or absent. */

export interface SetCardmarketSnapshot {
	/** ISO timestamp of the build that fetched this, shown wherever a euro
	 * price is, so a price is never presented as more current than it is. */
	capturedAt: string;
	/** Cardmarket's own createdAt for the catalogue this was built from. */
	sourceUpdatedAt: string;
	currency: "EUR";
	/** Trend price of a single sealed booster pack, or null when Cardmarket
	 * lists none for this set. Never a converted dollar figure. */
	packPrice: number | null;
	/** Trend price of a sealed booster box, same caveat. */
	boxPrice: number | null;
	/** Keyed by a printing's uniqueId (see ResolvedCard.printingId). A
	 * missing key means "no euro price we can prove", never zero. */
	cardPrices: Record<string, number>;
}

const priceLoader = createCachedJsonLoader<SetCardmarketSnapshot>(
	(setCode) => `/data/pack-opener/prices-cm/${setCode}.json`,
	(setCode) => `Cardmarket price snapshot fetch failed for ${setCode}`,
);

/** Fetches and caches one set's euro snapshot, with the same contract on
 * failure as fab-prices.ts's loadSetPrices: a rejection means "no euro prices
 * available", shown as a neutral "no price" state, never a zero and never a
 * dollar figure wearing a euro sign. */
export function loadSetCardmarketPrices(
	setCode: string,
): Promise<SetCardmarketSnapshot> {
	return priceLoader.load(setCode);
}

/** Synchronous accessor — null until loadSetCardmarketPrices() for that set
 * has resolved (or if it never will). */
export function getSetCardmarketPrices(
	setCode: string,
): SetCardmarketSnapshot | null {
	return priceLoader.get(setCode) ?? null;
}

/** A pulled card's Cardmarket price in euros, or null when unavailable for
 * any reason: the snapshot is not loaded yet, the card is a placeholder or is
 * shown in a treatment its printing doesn't have, or Cardmarket's own listing
 * for it could not be matched without guessing. */
export function getCardEuroPrice(
	setCode: string,
	printingId: string | null,
): number | null {
	if (!printingId) return null;
	const snapshot = getSetCardmarketPrices(setCode);
	if (!snapshot) return null;
	return snapshot.cardPrices[printingId] ?? null;
}
