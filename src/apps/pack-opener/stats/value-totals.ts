import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import type { PriceReader } from "@fabkit/apps/pack-opener/lib/pricing";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";

/** Adds up the prices that are known. Null when nothing at all is priced yet;
 * partial when some but not all of them are. The one rule behind every total a
 * player sees, per pack or per session. */
export function sumKnown(values: (number | null)[]): {
	total: number | null;
	isPartial: boolean;
} {
	const known = values.filter((value): value is number => value !== null);
	return {
		total:
			known.length > 0 ? known.reduce((sum, value) => sum + value, 0) : null,
		isPartial: known.length > 0 && known.length < values.length,
	};
}

/** Totals value pulled and value spent across the whole session. `resolve` is
 * injected for the same reason computeSessionStats' `rarityOf` is: it keeps
 * stats/ a pure function of its inputs. */
export function computeValueTotals(
	openedPacks: OpenedPackRecord[],
	prices: PriceReader,
	resolve: (card: DrawnCard, setCode: string) => ResolvedCard,
) {
	const pulled = sumKnown(
		openedPacks.flatMap((record) =>
			record.cards.map((card) =>
				prices.card(record.setCode, resolve(card, record.setCode)),
			),
		),
	);
	const spent = sumKnown(
		openedPacks.map((record) => prices.pack(record.setCode)),
	);

	return {
		pulledValue: pulled.total,
		spent: spent.total,
		isPartial: pulled.isPartial || spent.isPartial,
	};
}
