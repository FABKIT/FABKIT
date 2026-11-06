import { expectedRarityCounts } from "@fabkit/apps/pack-opener/pack/pull-rates";
import type {
	DrawnCard,
	PackConfig,
} from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

/** One completed pack, as the store records it (see stores/pack-opener.ts's
 * openedPacksThisSession) — just enough to aggregate from, nothing that
 * needs card resolution or price lookups (those are injected, here and in
 * stats/value-totals.ts).
 * Kept deliberately this shape, not a random session id or a full
 * ResolvedCard list, so promoting this to persistent per-device history
 * later is "persist this array", not a redesign. */
export interface OpenedPackRecord {
	setCode: string;
	cards: DrawnCard[];
}

interface RarityStat {
	rarity: CardRarity;
	pulled: number;
	/** Percentage of this set's pulled cards that were this rarity. */
	pulledPercent: number;
	/** Percentage this rarity is *expected* to make up, derived from the
	 * set's own PackConfig (see pack/pull-rates.ts's expectedRarityCounts) — the number a
	 * player compares their own pulls against to see if they ran hot or
	 * cold. Null when the set's config was never resolved (shouldn't happen
	 * for any set actually opened, since openPack() always resolves one). */
	expectedPercent: number | null;
}

interface SetSessionStats {
	setCode: string;
	packsOpened: number;
	totalCards: number;
	rarities: RarityStat[];
}

export interface SessionStats {
	totalPacksOpened: number;
	bySet: SetSessionStats[];
}

/** Aggregates a session's opened packs into per-set stats — pure, no
 * card-resolution or price lookups, so it's trivially testable and trivially
 * promotable to run over a persisted list later instead of an in-memory
 * one. `configFor` is injected rather than imported directly so this stays
 * a pure function of its inputs (matches getPackConfig's own signature), and
 * `rarityOf` likewise: a cold upgrade can redraw into a different rarity, so
 * the session counts what the player saw, which only a resolver can say. */
export function computeSessionStats(
	records: OpenedPackRecord[],
	configFor: (setCode: string) => PackConfig,
	rarityOf: (card: DrawnCard, setCode: string) => CardRarity,
): SessionStats {
	const bySetCode = new Map<string, OpenedPackRecord[]>();
	for (const record of records) {
		const list = bySetCode.get(record.setCode);
		if (list) {
			list.push(record);
		} else {
			bySetCode.set(record.setCode, [record]);
		}
	}

	const bySet: SetSessionStats[] = [];
	for (const [setCode, setRecords] of bySetCode) {
		const config = configFor(setCode);
		const expected = expectedRarityCounts(config);
		const expectedTotal = Object.values(expected).reduce(
			(sum, count) => sum + (count ?? 0),
			0,
		);

		const pulledByRarity = new Map<CardRarity, number>();
		let totalCards = 0;
		for (const record of setRecords) {
			for (const card of record.cards) {
				const rarity = rarityOf(card, setCode);
				pulledByRarity.set(rarity, (pulledByRarity.get(rarity) ?? 0) + 1);
				totalCards += 1;
			}
		}

		const rarities: RarityStat[] = [...pulledByRarity.entries()]
			.map(([rarity, pulled]) => ({
				rarity,
				pulled,
				pulledPercent: totalCards > 0 ? (pulled / totalCards) * 100 : 0,
				expectedPercent:
					expectedTotal > 0
						? ((expected[rarity] ?? 0) / expectedTotal) * 100
						: null,
			}))
			.sort((a, b) => b.pulled - a.pulled);

		bySet.push({
			setCode,
			packsOpened: setRecords.length,
			totalCards,
			rarities,
		});
	}

	bySet.sort((a, b) => b.packsOpened - a.packsOpened);

	return {
		totalPacksOpened: records.length,
		bySet,
	};
}
