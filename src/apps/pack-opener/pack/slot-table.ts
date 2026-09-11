import type { RarityWeight } from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

/** Weights are integers, so rates become integers by scaling. A million
 * is far finer than any rate in pack/published-rates.ts needs (the rarest
 * is 1 per 390 packs) and keeps the rounding error invisible. */
const WEIGHT_SCALE = 1_000_000;

export interface SlotRate extends Omit<RarityWeight, "weight"> {
	/** How many cards of this rarity the whole slot yields per pack. A
	 * slot with `count: 2` splits this across its two draws, so pass the
	 * published per-pack figure and let the helper do the division. */
	perPack: number;
}

/**
 * Turns published per-pack rates into the weight table the generator draws
 * with.
 *
 * A slot deals exactly one card, so its rates are shares of one card and
 * cannot total more than 1. Everything not claimed by a listed rate goes
 * to `filler` — the rarity that slot lands on the rest of the time, which
 * for almost every slot is the ordinary outcome (Common in a foil slot,
 * Rare in a rare-or-higher slot, Basic in a wildcard).
 *
 * Existing to be edited is the point: pack/published-rates.ts is meant to
 * be changed by hand, and a hand-edited rate that overshoots its slot is
 * the obvious way to break this. Left unchecked, `weightedPick` would sum
 * a table containing a negative weight and walk it subtracting, quietly
 * skewing the distribution rather than failing. So an over-full slot
 * throws here instead, at module load, naming the slot and the overshoot.
 */
export function slotTable(
	/** Names the slot in the error message. Worth a real description: this
	 * throws at startup, and the reader is whoever just edited a rate. */
	label: string,
	entries: SlotRate[],
	/** The rarity the slot lands on when none of the rates above claim it.
	 * Takes the same extras as any other entry, so an Equipment slot's
	 * filler can carry `requiresType` the way its listed rates do. */
	filler: CardRarity | Omit<RarityWeight, "weight">,
	count = 1,
): RarityWeight[] {
	const scaled = entries.map((entry) => ({
		...entry,
		weight: Math.round((entry.perPack / count) * WEIGHT_SCALE),
	}));
	const claimed = scaled.reduce((sum, entry) => sum + entry.weight, 0);
	const remaining = WEIGHT_SCALE - claimed;
	if (remaining < 0) {
		const over = (-remaining / WEIGHT_SCALE).toFixed(3);
		throw new Error(
			`${label}: the rates in this slot add up to more than one card ` +
				`(over by ${over} per pack). A slot deals one card, so its rates ` +
				`have to leave room for what it lands on otherwise. ` +
				`Lower one of them in pack/published-rates.ts.`,
		);
	}
	const fillerEntry = typeof filler === "string" ? { rarity: filler } : filler;
	return [
		{ ...fillerEntry, weight: remaining },
		...scaled.map(({ perPack: _perPack, ...weight }) => weight),
	];
}
