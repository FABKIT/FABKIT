import { createCachedJsonLoader } from "@fabkit/shared/data/cached-json-loader";

/**
 * One set's price snapshot in EUROS, from Cardmarket — the European
 * counterpart of fab-prices.ts, built at the same time by the same build
 * script (scripts/build-pack-data.ts, via scripts/cardmarket.ts) into
 * public/data/pack-opener/prices-cm/<CODE>.json.
 *
 * A deliberate parallel module rather than another field on
 * SetPriceSnapshot, for three reasons that all point the same way:
 *
 *   - it is keyed differently. TCGplayer prices a product per foiling
 *     subtype, so the dollar file is keyed by (tcgplayerProductId,
 *     treatment); Cardmarket has its own product ids that nothing in any
 *     Flesh and Blood dataset carries, so the euro file is keyed by the
 *     printing's own uniqueId instead.
 *   - it covers different cards. The GEM Packs are barely on TCGplayer and
 *     almost fully on Cardmarket; older sets are the other way round. A
 *     player switching currency is switching marketplace, and each one
 *     genuinely knows about different cardboard.
 *   - it is fetched separately, so a visitor who never touches the
 *     currency switch never downloads the file for the other one.
 *
 * Nothing here ever converts between the two currencies. A euro figure is
 * a real Cardmarket euro figure or it is absent — see scripts/cardmarket.ts
 * for the matching rules and for which cards deliberately go unpriced.
 */

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
