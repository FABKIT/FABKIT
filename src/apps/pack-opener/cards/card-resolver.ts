import { hashToIndex } from "@fabkit/apps/pack-opener/cards/deterministic-hash";
import type { MockPitch } from "@fabkit/apps/pack-opener/cards/mock-card";
import { resolveMockCard } from "@fabkit/apps/pack-opener/cards/mock-card";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type { FabCard } from "@fabkit/shared/data/fab-card-dataset";
import { getFabCardsByRarity } from "@fabkit/shared/data/fab-card-dataset";
import type {
	FabPrinting,
	FoilTreatment,
} from "@fabkit/shared/data/fab-printings";
import {
	getSetPrintings,
	hasType,
	isClassCard,
	printingImageUrl,
} from "@fabkit/shared/data/fab-printings";

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
	treatment: FoilTreatment;
	imageUrl: string | null;
	set?: string;
	pitch: MockPitch | 1 | 2 | 3;
	cost: number | null;
	power: number | null;
	defense: number | null;
	/** The-fab-cube's TCGplayer product id for this exact printing — null
	 * for mock cards and for real cards resolved outside their own set (see
	 * fabDatasetCardResolver below), since a price lookup needs the specific
	 * printing, not just a card name. Used by the price snapshot (see the
	 * execution plan, section 4.4) to match a pulled card to a price. */
	tcgplayerProductId: string | null;
}

export interface CardResolver {
	/** `setCode` is the set the pack was actually generated for (see
	 * stores/pack-opener.ts's `packSetCode`) — omitted by resolvers that
	 * don't need it (mock, the cross-set fallback below). */
	resolve(drawn: DrawnCard, setCode?: string): ResolvedCard;
}

export const mockCardResolver: CardResolver = {
	resolve(drawn) {
		const mock = resolveMockCard(drawn);
		return {
			id: mock.id,
			name: mock.name,
			rarity: mock.rarity,
			treatment: mock.treatment,
			imageUrl: null,
			pitch: mock.pitch,
			cost: mock.cost,
			power: mock.power,
			defense: mock.defense,
			tcgplayerProductId: null,
		};
	},
};

/**
 * The dataset has no cards of rarity "token" or "marvel" (see
 * fab-card-dataset.ts) — tokens aren't guessable trivia answers in the
 * source game, and Marvel is a foil treatment layered onto an existing
 * card's own rarity, not a rarity of its own. When a pack slot draws one of
 * those, substitute a real card from a nearby, populated rarity so the pull
 * still shows a genuine card image rather than falling back to mock art.
 *
 * Only fabDatasetCardResolver (the cross-set fallback) needs this: real
 * per-set printings (fabPrintingsCardResolver, below) DO have genuine
 * Token, Marvel and Fabled printings for most modern sets — see the
 * execution plan, section 2.2, "real Marvel, Token and Fabled cards with
 * real art replace it".
 */
function substituteRarityFor(rarity: CardRarity): CardRarity {
	if (rarity === "token") return "basic";
	if (rarity === "marvel") return "legendary";
	return rarity;
}

/** Resolves cards from the global, cross-set FAB dataset (see
 * shared/data/fab-card-dataset.ts) — picked deterministically per drawn
 * card id so re-renders don't reshuffle which real card a slot shows. This
 * is the fallback path, used when a real per-set printing genuinely isn't
 * available (see fabPrintingsCardResolver below): it shows a real card, but
 * not necessarily one actually printed in the pack's own set, and it never
 * carries a tcgplayerProductId (a cross-set substitute isn't the specific
 * printing a price would be for). */
export const fabDatasetCardResolver: CardResolver = {
	resolve(drawn) {
		const pool = getFabCardsByRarity(substituteRarityFor(drawn.rarity));
		if (pool.length === 0) return mockCardResolver.resolve(drawn);
		const picked = pool[hashToIndex(drawn.id, pool.length)];
		return toResolvedCardFromFabCard(drawn, picked);
	},
};

function toResolvedCardFromFabCard(
	drawn: DrawnCard,
	real: FabCard,
): ResolvedCard {
	return {
		id: drawn.id,
		name: real.name,
		// Keep the slot's own drawn rarity (not real.rarity) — for the
		// token/marvel substitute pools, real.rarity is a stand-in pool, but
		// the pack's odds model and HUD should still reflect what was
		// actually drawn.
		rarity: drawn.rarity,
		treatment: drawn.treatment,
		imageUrl: real.imageUrl,
		pitch: real.pitch,
		cost: real.cost,
		power: real.power,
		defense: real.defense,
		tcgplayerProductId: null,
	};
}

/** Every real printing in `setCode` matching what was actually drawn — same
 * exact-match rules tests/pack-opener/pool-viability.test.ts already
 * verifies are non-empty for every slot in every real set config, so this
 * only comes back empty for a set the odds engine didn't generate the pack
 * from (the mock "default-mock-set" config, or a real set whose printing
 * data hasn't finished loading yet — see stores/pack-opener.ts's
 * loadSetPrintings calls). */
function poolForDrawn(setCode: string, drawn: DrawnCard): FabPrinting[] {
	return getSetPrintings(setCode).filter(
		(printing) =>
			printing.rarity === drawn.rarity &&
			printing.expansionSlot === drawn.expansionSlot &&
			(!drawn.requiresType || hasType(printing, drawn.requiresType)) &&
			(drawn.classRestricted === undefined ||
				isClassCard(printing) === drawn.classRestricted),
	);
}

/** Real per-set data is the tie-breaker between what the odds engine drew
 * and what the set actually printed — see the execution plan, section 3.3.
 * The engine's own draw wins when it deliberately produced a foil (the
 * cold-foil upgrade roll is a pack mechanic, not a property of any one
 * card), but when it drew "standard" and this exact printing was never
 * printed that way, the printing wins instead. In most modern sets every
 * Legendary is foil-only (see set-configs.ts's own per-set counts), so this
 * is the common case in practice for Legendary pulls specifically — a few
 * older sets (History Pack 1, Compendium of Rathe, Bright Lights, and a
 * couple of others) print some Legendaries plain, and those are left alone
 * since the printing's own foiling already agrees with a "standard" draw
 * there. */
export function resolveTreatment(
	drawn: DrawnCard,
	printing: FabPrinting,
): FoilTreatment {
	if (drawn.treatment === "standard" && printing.foiling !== "standard") {
		return printing.foiling;
	}
	return drawn.treatment;
}

function toResolvedCardFromPrinting(
	drawn: DrawnCard,
	printing: FabPrinting,
	setCode: string,
): ResolvedCard {
	return {
		id: drawn.id,
		name: printing.name,
		rarity: drawn.rarity,
		treatment: resolveTreatment(drawn, printing),
		imageUrl: printingImageUrl(printing),
		set: setCode,
		pitch: printing.pitch,
		cost: printing.cost,
		power: printing.power,
		defense: printing.defense,
		tcgplayerProductId: printing.tcgplayerProductId,
	};
}

/** Resolves cards from the pulled card's OWN set (see
 * shared/data/fab-printings.ts) — the printing shown genuinely comes from
 * the set on the pack, at that set's own printed rarity, with that set's
 * own art and TCGplayer product id. See the execution plan, sections 2.1-2.2
 * for why this matters: the global dataset can show a card's art from the
 * wrong set entirely.
 *
 * Falls back to the cross-set dataset when `setCode` is missing (the mock
 * config) or that set's own pool genuinely has nothing matching (data still
 * loading, or a slot pool-viability hasn't verified — should not happen for
 * a real set's own config, see poolForDrawn's comment). */
export const fabPrintingsCardResolver: CardResolver = {
	resolve(drawn, setCode) {
		if (setCode) {
			const pool = poolForDrawn(setCode, drawn);
			if (pool.length > 0) {
				const picked = pool[hashToIndex(drawn.id, pool.length)];
				return toResolvedCardFromPrinting(drawn, picked, setCode);
			}
		}
		return fabDatasetCardResolver.resolve(drawn);
	},
};

/** Swap point for card content — real per-set printings, with the cross-set
 * dataset and mock/placeholder as graceful fallbacks baked into the
 * resolvers themselves. */
export const activeCardResolver: CardResolver = fabPrintingsCardResolver;
