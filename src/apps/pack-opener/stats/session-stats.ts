import type {
	DrawnCard,
	PackConfig,
} from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

/** One completed pack, as the store records it (see stores/pack-opener.ts's
 * openedPacksThisSession) — just enough to aggregate from, nothing that
 * needs card resolution or price lookups (those stay in the component, see
 * SessionStatsDialog.tsx, same as PackSummary.tsx already does for prices).
 * Kept deliberately this shape, not a random session id or a full
 * ResolvedCard list, so promoting this to persistent per-device history
 * later (see the execution plan, section 9) is "persist this array", not a
 * redesign. */
export interface OpenedPackRecord {
	setCode: string;
	cards: DrawnCard[];
}

export interface RarityStat {
	rarity: CardRarity;
	pulled: number;
	/** Percentage of this set's pulled cards that were this rarity. */
	pulledPercent: number;
	/** Percentage this rarity is *expected* to make up, derived from the
	 * set's own PackConfig (see expectedRarityCounts below) — the number a
	 * player compares their own pulls against to see if they ran hot or
	 * cold. Null when the set's config was never resolved (shouldn't happen
	 * for any set actually opened, since openPack() always resolves one). */
	expectedPercent: number | null;
}

export interface SetSessionStats {
	setCode: string;
	packsOpened: number;
	totalCards: number;
	rarities: RarityStat[];
}

export interface SessionStats {
	totalPacksOpened: number;
	bySet: SetSessionStats[];
}

/** Expected number of cards of each rarity in a single pack from `config`,
 * derived the same way generate-pack.ts actually draws (weight / total
 * weight per slot, times the slot's card count) — see that file's
 * weightedPick. Also folds in the premium-foil slot's marvelChance upgrade,
 * since that measurably shifts its slot's real rarity mix. This is an
 * expectation, not a guarantee — real packs vary, which is the whole point
 * of showing it next to what was actually pulled.
 *
 * Exported for pack/pull-rates.ts too, which turns these same expected
 * counts into the percentages SetInfoDialog.tsx shows before a pack is even
 * opened — one source for both, so the two views can't drift apart. */
export function expectedRarityCounts(
	config: PackConfig,
): Partial<Record<CardRarity, number>> {
	const counts: Partial<Record<CardRarity, number>> = {};
	const add = (rarity: CardRarity, amount: number) => {
		counts[rarity] = (counts[rarity] ?? 0) + amount;
	};

	for (const slot of config.slots) {
		const totalWeight = slot.rarityTable.reduce(
			(sum, entry) => sum + entry.weight,
			0,
		);
		if (totalWeight === 0) continue;
		const isPremiumFoil =
			slot.kind === "premium-foil" && config.marvelChance > 0;
		for (const entry of slot.rarityTable) {
			let expected = (entry.weight / totalWeight) * slot.count;
			if (isPremiumFoil) expected *= 1 - config.marvelChance;
			add(entry.rarity, expected);
		}
		if (isPremiumFoil) add("marvel", slot.count * config.marvelChance);
	}

	return counts;
}

/** Aggregates a session's opened packs into per-set stats — pure, no
 * card-resolution or price lookups, so it's trivially testable and, per the
 * execution plan section 4.5's "designed for, not built", trivially
 * promotable to run over a persisted list later instead of an in-memory
 * one. `configFor` is injected rather than imported directly so this stays
 * a pure function of its inputs (matches getPackConfig's own signature). */
export function computeSessionStats(
	records: OpenedPackRecord[],
	configFor: (setCode: string) => PackConfig,
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
				pulledByRarity.set(
					card.rarity,
					(pulledByRarity.get(card.rarity) ?? 0) + 1,
				);
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
