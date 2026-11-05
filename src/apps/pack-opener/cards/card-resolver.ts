import { hashToIndex } from "@fabkit/apps/pack-opener/cards/deterministic-hash";
import type { MockPitch } from "@fabkit/apps/pack-opener/cards/mock-card";
import { resolveMockCard } from "@fabkit/apps/pack-opener/cards/mock-card";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type {
	FabPrinting,
	FoilTreatment,
} from "@fabkit/shared/data/fab-printings";
import {
	getSetPrintings,
	hasType,
	isClassCard,
	printingBackImageUrl,
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
	/** The other face's art, for the roughly 500 real printings that are one
	 * face of a double-faced card, otherwise null. Always null for a mock
	 * card. Nothing to do with CARD_BACK_URL, which is the generic Flesh and
	 * Blood back used as a loading placeholder. */
	backImageUrl: string | null;
	set?: string;
	pitch: MockPitch | 1 | 2 | 3;
	cost: number | null;
	power: number | null;
	defense: number | null;
	/** The-fab-cube's TCGplayer product id for this exact printing, null for a
	 * mock card. The dollar price snapshot looks a card up by this plus its
	 * treatment, because TCGplayer prices each foiling separately. */
	tcgplayerProductId: string | null;
	/** The-fab-cube's own id for this exact printing. This is what the euro
	 * price snapshot is keyed by rather than a TCGplayer id (see
	 * shared/data/fab-prices-cm.ts): Cardmarket is a different marketplace
	 * with its own product ids, and several sets Cardmarket prices well carry
	 * no TCGplayer id at all. Null for a mock card, and for a card shown in a
	 * treatment this printing doesn't have, since that printing's euro price
	 * would be the price of a different card. */
	printingId: string | null;
}

interface CardResolver {
	/** `setCode` is the set the pack was actually generated for (see
	 * stores/pack-opener.ts's `packSetCode`) — omitted for the mock config. */
	resolve(drawn: DrawnCard, setCode?: string): ResolvedCard;
}

const mockCardResolver: CardResolver = {
	resolve(drawn) {
		const mock = resolveMockCard(drawn);
		return {
			id: mock.id,
			name: mock.name,
			rarity: mock.rarity,
			treatment: mock.treatment,
			imageUrl: null,
			backImageUrl: null,
			pitch: mock.pitch,
			cost: mock.cost,
			power: mock.power,
			defense: mock.defense,
			tcgplayerProductId: null,
			printingId: null,
		};
	},
};

/** Rarities a Cold Foil redraw must never land on. Each has its own published
 * or estimated rate, and an upgrade on an ordinary slot handing them out on top
 * of that would quietly raise the odds of a set's best cards. */
const COLD_REDRAW_EXCLUDED: ReadonlySet<CardRarity> = new Set<CardRarity>([
	"legendary",
	"fabled",
	"marvel",
]);

/** Every real printing in `setCode` matching what was actually drawn — same
 * exact-match rules tests/pack-opener/pool-viability.test.ts already
 * verifies are non-empty for every slot in every real set config, so this
 * only comes back empty for a set the odds engine didn't generate the pack
 * from (the mock "default-mock-set" config, or a real set whose printing
 * data hasn't finished loading yet — see stores/pack-opener.ts's
 * loadSetPrintings calls).
 *
 * Foiling is a PREFERENCE, not part of the exact match, and that
 * distinction is the whole point of this function's shape. Most rarities
 * exist in a set as both plain and foil printings — roughly half of High
 * Seas' common pool is Rainbow/Cold Foil, for instance — so matching on
 * rarity alone and letting resolveTreatment() adopt whatever printing came
 * back turned about half of every pack's commons into foils. A pack is
 * supposed to hold exactly one guaranteed foil (plus the occasional cold
 * foil upgrade or foil-only Legendary), not eight.
 *
 * So: filter to printings actually printed in the treatment that was
 * drawn, and only fall back to the unfiltered pool when the set never
 * printed this rarity that way at all. That fallback is exactly what keeps
 * "the real printed card wins" working for Legendary (see
 * resolveTreatment below) — a standard-drawn Legendary in a set that only
 * ever printed Legendaries foil finds no standard match, falls back, and
 * gets correctly promoted to foil.
 *
 * The Cold Foil upgrade is the exception to that fallback. It targets a slot,
 * and the slot's rarity often has no cold printing at all: Heavy Hitters
 * upgrades a Token, but prints no cold Tokens. Falling back there would show a
 * plain Token with a foil shader, a card that doesn't exist. So an upgrade with
 * no cold printing at the drawn rarity redraws from the set's real cold
 * printings instead, leaving how often a pack upgrades untouched. */
export function selectPrintingPool(
	printings: FabPrinting[],
	drawn: DrawnCard,
): FabPrinting[] {
	const matching = printings.filter(
		(printing) =>
			printing.rarity === drawn.rarity &&
			printing.expansionSlot === drawn.expansionSlot &&
			(!drawn.requiresType || hasType(printing, drawn.requiresType)) &&
			(drawn.classRestricted === undefined ||
				isClassCard(printing) === drawn.classRestricted),
	);
	const sameTreatment = matching.filter(
		(printing) => printing.foiling === drawn.treatment,
	);
	if (sameTreatment.length > 0) return sameTreatment;

	if (drawn.treatment === "cold" && !COLD_REDRAW_EXCLUDED.has(drawn.rarity)) {
		const coldRedraw = printings.filter(
			(printing) =>
				printing.foiling === "cold" &&
				!COLD_REDRAW_EXCLUDED.has(printing.rarity),
		);
		if (coldRedraw.length > 0) return coldRedraw;
	}
	return matching;
}

function poolForDrawn(setCode: string, drawn: DrawnCard): FabPrinting[] {
	return selectPrintingPool(getSetPrintings(setCode), drawn);
}

/** Real per-set data is the tie-breaker between what the odds engine drew and
 * what the set actually printed. The printing wins in three cases:
 *
 *  - A Fabled always carries its own foiling. Real ones are Rainbow, Cold or
 *    both depending on the set, and the premium slot's fixed Rainbow says
 *    nothing about which: Everfest, Dynasty and Heavy Hitters print only Cold.
 *  - A "standard" draw of a printing never printed plain. In most modern sets
 *    every Legendary is foil-only (see set-configs.ts's own per-set counts), so
 *    this is the common case for Legendary pulls. A few older sets (History
 *    Pack 1, Compendium of Rathe, Bright Lights, and a couple of others) print
 *    some Legendaries plain, and those are left alone since the printing's own
 *    foiling already agrees with a "standard" draw there.
 *  - A Cold Foil upgrade on a printing with no cold version, which only happens
 *    when the set had no cold printing to redraw from (see selectPrintingPool).
 *    Showing it plain beats showing a foil that doesn't exist.
 *
 * Otherwise the engine's draw stands: the premium slot's Rainbow is a property
 * of the slot. */
export function resolveTreatment(
	drawn: DrawnCard,
	printing: FabPrinting,
): FoilTreatment {
	if (drawn.rarity === "fabled") return printing.foiling;
	if (drawn.treatment === "standard" || drawn.treatment === "cold") {
		if (printing.foiling !== drawn.treatment) return printing.foiling;
	}
	return drawn.treatment;
}

function toResolvedCardFromPrinting(
	drawn: DrawnCard,
	printing: FabPrinting,
	setCode: string,
): ResolvedCard {
	const treatment = resolveTreatment(drawn, printing);
	return {
		id: drawn.id,
		name: printing.name,
		// The printing's, not the draw's: a Cold Foil redraw can land on a
		// different rarity from the slot it upgraded, and the card shown is
		// what the player should see named.
		rarity: printing.rarity,
		treatment,
		imageUrl: printingImageUrl(printing),
		backImageUrl: printingBackImageUrl(printing),
		set: setCode,
		pitch: printing.pitch,
		cost: printing.cost,
		power: printing.power,
		defense: printing.defense,
		tcgplayerProductId: printing.tcgplayerProductId,
		printingId: treatment === printing.foiling ? printing.uniqueId : null,
	};
}

/** Resolves cards from the pulled card's OWN set (see
 * shared/data/fab-printings.ts) — the printing shown genuinely comes from
 * the set on the pack, at that set's own printed rarity, with that set's
 * own art and TCGplayer product id. Picked deterministically per drawn card id
 * so re-renders don't reshuffle which card a slot shows.
 *
 * Falls back to a mock card when `setCode` is missing (the mock config) or
 * that set's own pool genuinely has nothing matching (data still loading, or
 * failed to load). */
const fabPrintingsCardResolver: CardResolver = {
	resolve(drawn, setCode) {
		if (setCode) {
			const pool = poolForDrawn(setCode, drawn);
			if (pool.length > 0) {
				const picked = pool[hashToIndex(drawn.id, pool.length)];
				return toResolvedCardFromPrinting(drawn, picked, setCode);
			}
		}
		return mockCardResolver.resolve(drawn);
	},
};

/** Swap point for card content — real per-set printings, with mock/placeholder
 * as the graceful fallback baked into the resolver itself. */
export const activeCardResolver: CardResolver = fabPrintingsCardResolver;
