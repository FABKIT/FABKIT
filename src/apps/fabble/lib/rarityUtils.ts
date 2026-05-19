import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

// Maps pool rarity display names (title case, as stored in CanonicalCard/DailyCard)
// to CardRarity slugs used by the shared CardRarities design system.
export const DISPLAY_TO_RARITY: Record<string, CardRarity> = {
	Common: "common",
	Rare: "rare",
	"Super Rare": "superrare",
	Majestic: "majestic",
	Legendary: "legendary",
	Fabled: "fabled",
	Marvel: "marvel",
	Promo: "promo",
	Token: "token",
	"Basic Non-Premium": "basic",
};
