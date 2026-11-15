import type {
	DrawnCard,
	PackSlotKind,
} from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

/** The three stretches of a sorted pack, front to back. */
const COMMONS = 0;
const RARES = 1;
const BACK = 2;

/** Where a slot's card sits whatever it turned out to be, so a Legendary dealt
 * into the expansion slot stays at the back and one dealt in place of a Rare
 * stays with the rares. Slots missing here are placed by rarity instead: the
 * foil joins the cards of its own rarity, and an equipment slot holds either a
 * Common or a Legendary. */
const SLOT_GROUP: Partial<Record<PackSlotKind, number>> = {
	common: COMMONS,
	"generic-common": COMMONS,
	"class-common": COMMONS,
	promo: COMMONS,
	rare: RARES,
	"rare-or-majestic": RARES,
	"rare-or-super-rare-plus": RARES,
	token: BACK,
	"token-or-wildcard": BACK,
	basic: BACK,
	"basic-or-wildcard": BACK,
	"basic-or-token": BACK,
};

/** Lowest first. Also the order of cards within one stretch of the pack. */
const RARITY_ORDER: CardRarity[] = [
	"token",
	"basic",
	"common",
	"promo",
	"rare",
	"superrare",
	"majestic",
	"legendary",
	"marvel",
	"fabled",
];

/** What orderForReveal needs to know about the card a draw turns into. */
export interface ShownCard {
	rarity: CardRarity;
	isToken: boolean;
}

function groupForRarity(rarity: CardRarity): number {
	if (rarity === "common" || rarity === "promo") return COMMONS;
	if (rarity === "token" || rarity === "basic") return BACK;
	return RARES;
}

/**
 * Sorts a pack for reveal: commons, then rares and up, then the token, basic
 * and expansion slots. Within a stretch the lower rarity comes first, and the
 * premium foil is the last card of the stretch its rarity belongs to (a common
 * foil closes the commons, a rare or better closes the rares).
 *
 * Some older sets print their tokens at Common and deal them from the common
 * slots (Dusk till Dawn has no token slot at all). Those go to the back with
 * the other sets' tokens instead of sitting among the commons.
 *
 * `shownAs` is the card the player will see. The store passes the resolved
 * printing, since a Cold Foil redraw can land on a different rarity than the
 * draw, and only the printing knows whether a Common is a token. Cards that tie
 * keep the order they were dealt in.
 */
export function orderForReveal(
	cards: DrawnCard[],
	shownAs: (card: DrawnCard) => ShownCard = (card) => ({
		rarity: card.rarity,
		isToken: card.rarity === "token",
	}),
): DrawnCard[] {
	return cards
		.map((card) => {
			const { rarity, isToken } = shownAs(card);
			const group = SLOT_GROUP[card.slot] ?? groupForRarity(rarity);
			return {
				card,
				group: isToken && group === COMMONS ? BACK : group,
				isPremiumFoil: card.slot === "premium-foil" ? 1 : 0,
				rarityRank: RARITY_ORDER.indexOf(rarity),
			};
		})
		.sort(
			(a, b) =>
				a.group - b.group ||
				a.isPremiumFoil - b.isPremiumFoil ||
				a.rarityRank - b.rarityRank,
		)
		.map(({ card }) => card);
}
