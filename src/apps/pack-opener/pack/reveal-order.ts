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
 * `rarityOf` is the rarity the player will see. The store passes the resolved
 * printing's, since a Cold Foil redraw can land on a different rarity than the
 * draw. Cards that tie keep the order they were dealt in.
 */
export function orderForReveal(
	cards: DrawnCard[],
	rarityOf: (card: DrawnCard) => CardRarity = (card) => card.rarity,
): DrawnCard[] {
	return cards
		.map((card) => {
			const rarity = rarityOf(card);
			return {
				card,
				group: SLOT_GROUP[card.slot] ?? groupForRarity(rarity),
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
