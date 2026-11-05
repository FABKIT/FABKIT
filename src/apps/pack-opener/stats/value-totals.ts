import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import type { PriceReader } from "@fabkit/apps/pack-opener/lib/pricing";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";

/** Totals value pulled and value spent across the whole session, resolving
 * each drawn card to its printing (same activeCardResolver + lib/pricing
 * pattern PackLedger.tsx uses per pack) rather than folding this into the
 * pure stats module — see session-stats.ts's own doc comment on why price
 * lookups stay out of it. Null when nothing at all is priced yet; "partial"
 * when some but not all of what should be summed is known, mirroring
 * PackLedger.tsx's own partial-total handling. */
export function computeValueTotals(
	openedPacks: OpenedPackRecord[],
	prices: PriceReader,
) {
	let pulledValue = 0;
	let knownCardCount = 0;
	let totalCardCount = 0;
	let spent = 0;
	let knownPackCount = 0;

	for (const record of openedPacks) {
		totalCardCount += record.cards.length;
		for (const card of record.cards) {
			const resolved = activeCardResolver.resolve(card, record.setCode);
			const price = prices.card(record.setCode, resolved);
			if (price !== null) {
				pulledValue += price;
				knownCardCount += 1;
			}
		}
		const sealedPrice = prices.pack(record.setCode);
		if (sealedPrice !== null) {
			spent += sealedPrice;
			knownPackCount += 1;
		}
	}

	return {
		pulledValue: knownCardCount > 0 ? pulledValue : null,
		spent: knownPackCount > 0 ? spent : null,
		isPartial:
			(knownCardCount > 0 && knownCardCount < totalCardCount) ||
			(knownPackCount > 0 && knownPackCount < openedPacks.length),
	};
}
