export const CardRarities = {
	basic: {
		label: "card.rarity.basic",
		icon: "/img/rarities/rarity_basic.svg",
	},
	common: {
		label: "card.rarity.common",
		icon: "/img/rarities/rarity_common.svg",
	},
	rare: {
		label: "card.rarity.rare",
		icon: "/img/rarities/rarity_rare.svg",
	},
	superrare: {
		label: "card.rarity.superrare",
		icon: "/img/rarities/rarity_superrare.svg",
	},
	majestic: {
		label: "card.rarity.majestic",
		icon: "/img/rarities/rarity_majestic.svg",
	},
	legendary: {
		label: "card.rarity.legendary",
		icon: "/img/rarities/rarity_legendary.svg",
	},
	fabled: {
		label: "card.rarity.fabled",
		icon: "/img/rarities/rarity_fabled.svg",
	},
	token: {
		label: "card.rarity.token",
		icon: "/img/rarities/rarity_token.svg",
	},
	promo: {
		label: "card.rarity.promo",
		icon: "/img/rarities/rarity_promo.svg",
	},
	marvel: {
		label: "card.rarity.marvel",
		icon: "/img/rarities/rarity_marvel.svg",
	},
} as const;

export type CardRarity = keyof typeof CardRarities;
