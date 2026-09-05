import { hashToIndex } from "@fabkit/apps/pack-opener/cards/deterministic-hash";
import type { MockPitch } from "@fabkit/apps/pack-opener/cards/mock-card";
import { resolveMockCard } from "@fabkit/apps/pack-opener/cards/mock-card";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type { FabCard } from "@fabkit/shared/data/fab-card-dataset";
import { getFabCardsByRarity } from "@fabkit/shared/data/fab-card-dataset";

/**
 * Shape every 3D/UI component consumes, deliberately mirroring FabbleCard's
 * fields (name/imageUrl/rarity/set/pitch/cost/power/defense — see
 * src/apps/fabble/types.ts). `imageUrl` is null for mock/placeholder cards
 * and a real content.fabrary.net URL for real ones — the 3D layer (Card3D)
 * branches on its presence to pick a rendering path.
 */
export interface ResolvedCard {
	id: string;
	name: string;
	rarity: CardRarity;
	foil: boolean;
	marvel: boolean;
	imageUrl: string | null;
	set?: string;
	pitch: MockPitch | 1 | 2 | 3;
	cost: number | null;
	power: number | null;
	defense: number | null;
}

export interface CardResolver {
	resolve(drawn: DrawnCard): ResolvedCard;
}

export const mockCardResolver: CardResolver = {
	resolve(drawn) {
		const mock = resolveMockCard(drawn);
		return {
			id: mock.id,
			name: mock.name,
			rarity: mock.rarity,
			foil: mock.foil,
			marvel: mock.marvel,
			imageUrl: null,
			pitch: mock.pitch,
			cost: mock.cost,
			power: mock.power,
			defense: mock.defense,
		};
	},
};

function toResolvedCard(drawn: DrawnCard, real: FabCard): ResolvedCard {
	return {
		id: drawn.id,
		name: real.name,
		// Keep the slot's own drawn rarity (not real.rarity) — for the
		// token/marvel substitute pools below, real.rarity is a stand-in
		// pool, but the pack's odds model and HUD should still reflect what
		// was actually drawn.
		rarity: drawn.rarity,
		foil: drawn.foil,
		marvel: drawn.marvel,
		imageUrl: real.imageUrl,
		pitch: real.pitch,
		cost: real.cost,
		power: real.power,
		defense: real.defense,
	};
}

/**
 * The dataset has no cards of rarity "token" or "marvel" (see
 * fab-card-dataset.ts) — tokens aren't guessable trivia answers in the
 * source game, and Marvel is a foil treatment layered onto an existing
 * card's own rarity, not a rarity of its own. When a pack slot draws one of
 * those, substitute a real card from a nearby, populated rarity so the pull
 * still shows a genuine card image rather than falling back to mock art.
 */
function substituteRarityFor(rarity: CardRarity): CardRarity {
	if (rarity === "token") return "basic";
	if (rarity === "marvel") return "legendary";
	return rarity;
}

/** Resolves cards from the real FAB dataset (see
 * shared/data/fab-card-dataset.ts), picked deterministically per drawn card
 * id so re-renders don't reshuffle which real card a slot shows. Falls back
 * to a mock/placeholder card if the dataset hasn't loaded (or failed to)
 * by the time a pack is opened — the route loader awaits it up front, so
 * this should only trigger on a genuine load failure. */
export const fabDatasetCardResolver: CardResolver = {
	resolve(drawn) {
		const pool = getFabCardsByRarity(substituteRarityFor(drawn.rarity));
		if (pool.length === 0) return mockCardResolver.resolve(drawn);
		const picked = pool[hashToIndex(drawn.id, pool.length)];
		return toResolvedCard(drawn, picked);
	},
};

/** Swap point for card content — currently the real FAB dataset, with a
 * mock/placeholder fallback baked into fabDatasetCardResolver itself. */
export const activeCardResolver: CardResolver = fabDatasetCardResolver;
