import type { Migration } from "../migrations.ts";

export const meld_cards_migration: Migration = {
	// Meld card support introduced meldActiveHalf, meldHalfA, meldHalfB.
	// Records written before this version won't have these fields.
	version: "0.1.0",
	migrate(state) {
		const s = state as Record<string, unknown>;
		if (!("meldActiveHalf" in s)) s.meldActiveHalf = "A";
		if (!("meldHalfA" in s)) {
			s.meldHalfA = {
				CardType: "action",
				CardName: null,
				CardArtwork: null,
				CardArtPosition: null,
				CardClass: null,
				CardSecondaryClass: null,
				CardSubType: null,
				CardTalent: null,
				CardTextHTML: null,
				CardTextNode: null,
				CardMacroGroup: null,
				CardWeapon: null,
			};
		}
		if (!("meldHalfB" in s)) {
			s.meldHalfB = {
				CardType: "action",
				CardName: null,
				CardArtwork: null,
				CardArtPosition: null,
				CardClass: null,
				CardSecondaryClass: null,
				CardSubType: null,
				CardTalent: null,
				CardTextHTML: null,
				CardTextNode: null,
				CardMacroGroup: null,
				CardWeapon: null,
			};
		}
		return s;
	},
};
