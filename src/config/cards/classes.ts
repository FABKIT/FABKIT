export const CardClasses = {
	none: "card.class.none",
	adjudicator: "card.class.adjudicator",
	assassin: "card.class.assassin",
	bard: "card.class.bard",
	brute: "card.class.brute",
	generic: "card.class.generic",
	guardian: "card.class.guardian",
	illusionist: "card.class.illusionist",
	mechanologist: "card.class.mechanologist",
	merchant: "card.class.merchant",
	necromancer: "card.class.necromancer",
	ninja: "card.class.ninja",
	ranger: "card.class.ranger",
	runeblade: "card.class.runeblade",
	shapeshifter: "card.class.shapeshifter",
	warrior: "card.class.warrior",
	wizard: "card.class.wizard",
} as const;

export type CardClass = keyof typeof CardClasses;
