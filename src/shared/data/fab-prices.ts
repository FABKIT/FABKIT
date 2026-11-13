import { createCachedJsonLoader } from "@fabkit/shared/data/cached-json-loader";
import type { FoilTreatment } from "@fabkit/shared/data/fab-printings";

/** One set's TCGplayer price snapshot (USD, market price only). Kept apart from
 * fab-printings.ts because prices are a dated snapshot, not permanent card data. */
export interface SetPriceSnapshot {
	/** ISO timestamp of the tcgcsv fetch this file was built from — shown in
	 * the set info dialog so a price is never presented as more current
	 * than it is. */
	capturedAt: string;
	/** Market price of a single sealed booster pack for this set, or null
	 * when tcgcsv has no group match or no sealed-pack listing (see
	 * scripts/build-pack-data.ts's resolveGroup) — never a guessed or
	 * zero price. */
	packMarketPrice: number | null;
	/** Market price of a sealed booster box, same caveats as packMarketPrice. */
	boxMarketPrice: number | null;
	/** Keyed by `priceKey(tcgplayerProductId, treatment)` — see that helper.
	 * Only entries tcgcsv actually has a live market price for are present;
	 * a missing key means "no price available", not zero. */
	cardPrices: Record<string, number>;
}

/** The lookup key a printing's price is stored under — same shape used by
 * both the build script (writing) and this module's getCardPrice (reading),
 * so they can never drift apart. TCGplayer prices a product per treatment
 * subtype, and the-fab-cube's own printing rows can share one product id
 * across several treatments, so the id alone isn't a specific-enough key. */
export function priceKey(
	tcgplayerProductId: string,
	treatment: FoilTreatment,
): string {
	return `${tcgplayerProductId}:${treatment}`;
}

const priceLoader = createCachedJsonLoader<SetPriceSnapshot>(
	(setCode) => `/data/pack-opener/prices/${setCode}.json`,
	(setCode) => `Price snapshot fetch failed for ${setCode}`,
);

/** Fetches and caches one set's price snapshot. A set with no price file yet
 * (the build script never resolved a tcgcsv group for it, or hasn't run at
 * all in this environment) simply rejects, which the pack opener's
 * lib/pricing.ts warmPrices treats as "no prices available" rather than a
 * hard failure. */
export function loadSetPrices(setCode: string): Promise<SetPriceSnapshot> {
	return priceLoader.load(setCode);
}

/** Synchronous accessor — returns null until loadSetPrices() for that set
 * has resolved (or if it never will, e.g. no tcgcsv group match). */
export function getSetPrices(setCode: string): SetPriceSnapshot | null {
	return priceLoader.get(setCode) ?? null;
}

/** A pulled card's market price, or null when unavailable for any reason
 * (no price snapshot loaded yet, no tcgplayerProductId on the printing, or
 * tcgcsv simply has no live listing for that exact product+treatment).
 * Callers show a neutral "no price" state for null, never a zero. */
export function getCardPrice(
	setCode: string,
	tcgplayerProductId: string | null,
	treatment: FoilTreatment,
): number | null {
	if (!tcgplayerProductId) return null;
	const snapshot = getSetPrices(setCode);
	if (!snapshot) return null;
	return snapshot.cardPrices[priceKey(tcgplayerProductId, treatment)] ?? null;
}
