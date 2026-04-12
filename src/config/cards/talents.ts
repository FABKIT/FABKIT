export const CardTalents = {
	none: "card.talent.none",
	chaos: "card.talent.chaos",
	draconic: "card.talent.draconic",
	earth: "card.talent.earth",
	elemental: "card.talent.elemental",
	ice: "card.talent.ice",
	light: "card.talent.light",
	lightning: "card.talent.lightning",
	mystic: "card.talent.mystic",
	pirate: "card.talent.pirate",
	royal: "card.talent.royal",
	shadow: "card.talent.shadow",
} as const;

export type CardTalent = keyof typeof CardTalents;
