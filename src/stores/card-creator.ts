/**
 * Card Creator Store
 *
 * Centralized Zustand store for managing card creation state.
 * Handles all form fields, card artwork, card backs, and text content
 * for the TCG card creator application.
 */

import type { Content } from "@tiptap/react";
import { v4 as uuid } from "uuid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { isFieldVisible } from "../components/utils.ts";
import {
	type CardBack,
	CardBacks,
	getCardBacksForTypeAndStyle,
	getSuggestedCardBack,
} from "../config/cards/card_backs.ts";
import { type CardStyle, CardStyles } from "../config/cards/card_styles.ts";
import {
	type CardFormField,
	CardFormFields,
	type CardFormFieldValue,
} from "../config/cards/form_fields.ts";
import type { CardType } from "../config/cards/types.ts";
import { MeldFlatRenderConfigPreset } from "../config/rendering/meld_preset.tsx";

/**
 * Card types that are not allowed on a meld half.
 * Equipment, hero, weapon, demi-hero, and weapon-equipment cannot be meld halves.
 */
export const MELD_EXCLUDED_TYPES: CardType[] = [
	"equipment",
	"hero",
	"weapon",
	"demi_hero",
	"weapon_equipment",
	"meld",
	"event",
	"macro",
	"mentor",
];

/**
 * State for a single half of a meld card.
 * Each half is independently configurable (type, name, artwork, text, etc.).
 */
export interface MeldHalf {
	CardType: CardType | null;
	CardName: string | null;
	CardArtwork: Blob | null;
	CardArtPosition: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null;
	CardClass: string | null;
	CardSecondaryClass: string | null;
	CardSubType: string | null;
	CardTalent: string | null;
	CardTextHTML: string | null;
	CardTextNode: Content | null;
	CardMacroGroup: string | null;
	CardWeapon: "(1H)" | "(2H)" | null;
}

export const defaultMeldHalf: MeldHalf = {
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

/**
 * Utility type that maps all card form fields to their possible values.
 * Allows type-safe access to field values without duplicating type definitions.
 */
type FormFieldValues = {
	[K in CardFormField]: CardFormFieldValue[K] | null;
};

/**
 * Card Creator State
 *
 * Complete state shape for the card creator, including all form fields,
 * artwork configuration, and text content representations.
 */
export interface CardCreatorState extends FormFieldValues {
	/** Internal version UUID that changes with each reset, used for tracking persistence and cache invalidation */
	__version: string;

	/** Selected card type (action, hero, weapon, etc.) - determines which fields are visible */
	CardType: CardType | null;

	// ─── Meld card state ────────────────────────────────────────────────────────

	/** Which meld half is currently active in the tab editor ("A" = top half, "B" = bottom half) */
	meldActiveHalf: "A" | "B";

	/** Per-half state for the top half of a meld card */
	meldHalfA: MeldHalf;

	/** Per-half state for the bottom half of a meld card */
	meldHalfB: MeldHalf;

	/** Currently selected card back configuration object */
	CardBack: CardBack | null;

	/** Card back visual style variant - affects available card backs */
	CardBackStyle: CardStyle;

	/** Uploaded card artwork as a Blob, or null if no artwork uploaded */
	CardArtwork: Blob | null;

	/**
	 * Artwork positioning and scale configuration.
	 * Contains x/y offset and width/height dimensions for artwork placement on the card.
	 */
	CardArtPosition: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null;

	/** Artist credit text (auto-converted to uppercase) */
	CardArtworkCredits: string | null;

	/** Card set number text (auto-converted to uppercase) */
	CardSetNumber: string | null;

	/** HTML string representation of the rich text editor content (for display/export) */
	CardTextHTML: string | null;

	/** Tiptap editor's internal Content representation (for hydrating editor state) */
	CardTextNode: Content | null;

	/** Allows overlaying the card with another image */
	CardOverlay: Blob | null;

	/** The opacity applied to the overlay image */
	CardOverlayOpacity: number;
}

/**
 * Card Creator Actions
 *
 * All available store actions for modifying card creator state.
 * These actions handle validation, side effects, and state updates.
 */
export interface CardCreatorActions {
	/**
	 * Sets the card type and handles side effects:
	 * - Validates/updates card back compatibility
	 * - Clears fields that aren't visible for the new type
	 */
	setCardType: (cardType: CardType) => void;

	// ─── Meld actions ───────────────────────────────────────────────────────────

	/** Switches the active meld tab between the top half (A) and bottom half (B) */
	setMeldActiveHalf: (half: "A" | "B") => void;

	/** Sets the card type for a meld half */
	setMeldHalfType: (half: "A" | "B", cardType: CardType) => void;

	/** Sets the card name for a meld half */
	setMeldHalfName: (half: "A" | "B", name: string) => void;

	/**
	 * Sets artwork for a meld half and initialises the art position from
	 * the image's natural dimensions (same approach as setCardArtwork).
	 */
	setMeldHalfArtwork: (half: "A" | "B", artwork: Blob | null) => Promise<void>;

	/** Updates the artwork position for a meld half */
	setMeldHalfArtPosition: (
		half: "A" | "B",
		position: { x: number; y: number; width: number; height: number } | null,
	) => void;

	/** Sets the primary class for a meld half */
	setMeldHalfClass: (half: "A" | "B", cls: string) => void;

	/** Sets the secondary class for a meld half */
	setMeldHalfSecondaryClass: (half: "A" | "B", cls: string) => void;

	/** Sets the subtype for a meld half */
	setMeldHalfSubType: (half: "A" | "B", sub: string) => void;

	/** Sets the talent for a meld half */
	setMeldHalfTalent: (half: "A" | "B", talent: string) => void;

	/** Sets the card text (HTML + Tiptap content) for a meld half */
	setMeldHalfText: (half: "A" | "B", html: string, content: Content) => void;

	/** Sets the macro group for a meld half */
	setMeldHalfMacroGroup: (half: "A" | "B", group: string) => void;

	/** Sets the weapon hand type for a meld half */
	setMeldHalfWeapon: (half: "A" | "B", weapon: "(1H)" | "(2H)") => void;

	/** Sets the currently selected card back */
	setCardBack: (cardBack: CardBack) => void;

	/**
	 * Changes the card back style (flat/dented) and automatically
	 * selects the first available card back for that style
	 */
	setCardBackStyle: (backType: CardStyle) => void;

	/**
	 * Sets card artwork from a Blob and automatically initializes
	 * position based on natural image dimensions.
	 * Passing null clears both artwork and position.
	 * @returns Promise that resolves when image dimensions are loaded
	 */
	setCardArtwork: (artwork: Blob | null) => Promise<void>;

	/** Updates the artwork position and scale */
	setCardArtPosition: (
		position: {
			x: number;
			y: number;
			width: number;
			height: number;
		} | null,
	) => void;

	/** Sets artist credit text */
	setCardArtworkCredits: (credits: string | null) => void;

	/** Sets card set number text (automatically uppercased) */
	setCardSetNumber: (setNumber: string | null) => void;

	/**
	 * Updates card text content in both HTML and Tiptap Content formats.
	 * Both representations are stored for display and editor hydration.
	 */
	setCardText: (html: string, content: Content) => void;

	/** Sets card pitch value (red/yellow/blue) */
	setPitch: (pitch: CardFormFieldValue["CardPitch"]) => void;

	/** Sets card name */
	setCardName: (name: string) => void;

	/** Sets card resource value */
	setCardResource: (resource: CardFormFieldValue["CardResource"]) => void;

	/** Sets card power value */
	setCardPower: (power: CardFormFieldValue["CardPower"]) => void;

	/** Sets card talent */
	setCardTalent: (talent: CardFormFieldValue["CardTalent"]) => void;

	/** Sets primary card class */
	setCardClass: (cardClass: CardFormFieldValue["CardClass"]) => void;

	/** Sets secondary card class */
	setCardSecondaryClass: (
		cardClass: CardFormFieldValue["CardSecondaryClass"],
	) => void;

	/** Sets card subtype */
	setCardSubType: (subType: CardFormFieldValue["CardSubType"]) => void;

	/** Sets card rarity (basic, common, rare, legendary) */
	setCardRarity: (rarity: CardFormFieldValue["CardRarity"]) => void;

	/** Sets hero life value */
	setCardLife: (life: CardFormFieldValue["CardLife"]) => void;

	/** Sets card defense value */
	setCardDefense: (defense: CardFormFieldValue["CardDefense"]) => void;

	/** Sets hero intellect value */
	setCardHeroIntellect: (
		intellect: CardFormFieldValue["CardHeroIntellect"],
	) => void;

	/** Sets weapon type */
	setCardWeapon: (weapon: CardFormFieldValue["CardWeapon"]) => void;

	/** Sets card macro group */
	setCardMacroGroup: (group: CardFormFieldValue["CardMacroGroup"]) => void;

	setOverlay: (overlay: Blob | null) => void;

	setOverlayOpacity: (opacity: number) => void;

	/**
	 * Resets all state to initial values and generates a new version UUID.
	 * This invalidates any saved/cached state.
	 */
	reset: () => void;

	/**
	 * Loads a partial card state (used when opening saved cards from gallery).
	 * Merges provided state with current state.
	 */
	loadCard: (state: Partial<CardCreatorState>) => void;
}

/**
 * Initial state for the card creator.
 * Most fields are null/empty except for sensible defaults:
 * - First available card back
 * - "dented" back style (most common)
 * - "basic" rarity
 */
const defaultCardType: CardType = "action";
const defaultCardStyle: CardStyle = "dented";
const defaultCardBack =
	getSuggestedCardBack(
		getCardBacksForTypeAndStyle(defaultCardType, defaultCardStyle),
	) ?? CardBacks[0];

const initialState: CardCreatorState = {
	__version: uuid(),
	CardType: defaultCardType,
	CardBack: defaultCardBack,
	CardBackStyle: defaultCardStyle,
	CardArtwork: null,
	CardArtPosition: null,
	CardArtworkCredits: null,
	CardSetNumber: null,
	CardTextHTML: null,
	CardTextNode: null,
	CardPitch: null,
	CardName: null,
	CardResource: null,
	CardText: null,
	CardPower: null,
	CardTalent: null,
	CardClass: null,
	CardSecondaryClass: null,
	CardSubType: null,
	CardRarity: "basic",
	CardDefense: null,
	CardLife: null,
	CardHeroIntellect: null,
	CardWeapon: null,
	CardMacroGroup: null,
	CardOverlay: null,
	CardOverlayOpacity: 0.5,
	// Meld state
	meldActiveHalf: "A",
	meldHalfA: { ...defaultMeldHalf },
	meldHalfB: { ...defaultMeldHalf },
};

/**
 * Card Creator Store Hook
 *
 * Primary Zustand store for card creation state and actions.
 * Includes Redux DevTools integration for debugging.
 *
 * @example
 * const { CardType, setCardType } = useCardCreator();
 * setCardType('hero');
 */
export const useCardCreator = create<CardCreatorState & CardCreatorActions>()(
	devtools((set, _, store) => ({
		...initialState,
		setCardType: (cardType: CardType) =>
			set((state) => {
				// When selecting a new card type, make sure that either:
				// - the current card back is valid for that card type
				// - we select the first available card back for that card type
				let available = getCardBacksForTypeAndStyle(
					cardType,
					state.CardBackStyle,
				);
				let cardStyle = state.CardBackStyle;
				let cardBack: CardBack | null = state.CardBack;
				if (state.CardBack === null || !available.includes(state.CardBack))
					cardBack = getSuggestedCardBack(available);

				if (null === cardBack) {
					for (const style of CardStyles) {
						available = getCardBacksForTypeAndStyle(cardType, style);

						if (available.length > 0)
							cardBack = getSuggestedCardBack(available);

						if (null !== cardBack) {
							cardStyle = style;
							break;
						}
					}
				}

				// When we change the state some fields become invisible.
				// All fields that are not visible for the new card type are set to null.
				const result: Partial<CardCreatorState> = {
					CardType: cardType,
					CardBack: cardBack,
					CardBackStyle: cardStyle,
				};

				for (const field of CardFormFields) {
					if (!isFieldVisible(field, cardType)) {
						Object.assign(result, { [field]: null });
					}
				}

				if (cardType === "meld" && state.CardType !== cardType) {
					// Meld halves are not in CardFormFields so must be cleared explicitly.
					// Reset them on every type change so non-visible meld state doesn't persist.
					result.meldActiveHalf = "A";
					result.meldHalfA = { ...defaultMeldHalf };
					result.meldHalfB = { ...defaultMeldHalf };
				}

				return result;
			}),
		setCardBack: (cardBack: CardBack) => set({ CardBack: cardBack }),
		setCardBackStyle: (backType: CardStyle) =>
			set((state) => {
				// When changing card back style, we select the first available card back for that style.
				const available = getCardBacksForTypeAndStyle(state.CardType, backType);
				const cardBack = getSuggestedCardBack(available, state.CardBack);

				return { CardBackStyle: backType, CardBack: cardBack };
			}),
		setCardArtwork: async (artwork: Blob | null) => {
			// If clearing artwork, reset both artwork and position
			if (!artwork) {
				set({ CardArtwork: null, CardArtPosition: null });
				return;
			}

			// Load image to get natural dimensions
			const img = new Image();
			const url = URL.createObjectURL(artwork);

			try {
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error("Failed to load image"));
					img.src = url;
				});

				// Set artwork and initialize position with natural dimensions
				set({
					CardArtwork: artwork,
					CardArtPosition: {
						x: 0,
						y: 0,
						width: img.naturalWidth,
						height: img.naturalHeight,
					},
				});
			} finally {
				// Always clean up the object URL
				URL.revokeObjectURL(url);
			}
		},
		setCardArtPosition: (position: { x: number; y: number } | null) =>
			// biome-ignore lint/suspicious/noExplicitAny: Zustand uses merging, not overwriting.
			set({ CardArtPosition: position as any }),
		setCardArtworkCredits: (credits: string | null) =>
			set({ CardArtworkCredits: credits }),
		setCardSetNumber: (setNumber: string | null) =>
			set({ CardSetNumber: setNumber?.toUpperCase() }),
		setCardText: (html: string, content: Content) =>
			set({ CardTextHTML: html, CardTextNode: content }),
		setPitch: (pitch: CardFormFieldValue["CardPitch"]) =>
			set({ CardPitch: pitch }),
		setCardName: (name: string) => set({ CardName: name }),
		setCardResource: (resource: CardFormFieldValue["CardResource"]) =>
			set({ CardResource: resource }),
		setCardPower: (power: CardFormFieldValue["CardPower"]) =>
			set({ CardPower: power }),
		setCardTalent: (talent: CardFormFieldValue["CardTalent"]) =>
			set({ CardTalent: talent }),
		setCardClass: (cardClass: CardFormFieldValue["CardClass"]) =>
			set({ CardClass: cardClass }),
		setCardSecondaryClass: (
			cardClass: CardFormFieldValue["CardSecondaryClass"],
		) => set({ CardSecondaryClass: cardClass }),
		setCardSubType: (subType: CardFormFieldValue["CardSubType"]) =>
			set({ CardSubType: subType }),
		setCardRarity: (rarity: CardFormFieldValue["CardRarity"]) =>
			set({ CardRarity: rarity }),
		setCardLife: (life: CardFormFieldValue["CardLife"]) =>
			set({ CardLife: life }),
		setCardDefense: (defense: CardFormFieldValue["CardDefense"]) =>
			set({ CardDefense: defense }),
		setCardHeroIntellect: (
			intellect: CardFormFieldValue["CardHeroIntellect"],
		) => set({ CardHeroIntellect: intellect }),
		setCardWeapon: (weapon: CardFormFieldValue["CardWeapon"]) =>
			set({ CardWeapon: weapon }),
		setCardMacroGroup: (group: CardFormFieldValue["CardMacroGroup"]) =>
			set({ CardMacroGroup: group }),
		setOverlay: (overlay: Blob | null) => set({ CardOverlay: overlay }),
		setOverlayOpacity: (overlayOpacity: number) =>
			set({ CardOverlayOpacity: Math.max(0, Math.min(1, overlayOpacity)) }),
		reset: () => set({ ...store.getInitialState(), __version: uuid() }),
		loadCard: (state: Partial<CardCreatorState>) =>
			set({ ...store.getInitialState(), ...state }),

		// ─── Meld actions ──────────────────────────────────────────────────────
		setMeldActiveHalf: (half) => set({ meldActiveHalf: half }),

		setMeldHalfType: (half, cardType) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardType: cardType,
				},
			})),

		setMeldHalfName: (half, name) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardName: name,
				},
			})),

		setMeldHalfArtwork: async (half, artwork) => {
			const key = half === "A" ? "meldHalfA" : "meldHalfB";
			if (!artwork) {
				set((state) => ({
					[key]: {
						...(state[key] as MeldHalf),
						CardArtwork: null,
						CardArtPosition: null,
					},
				}));
				return;
			}
			const img = new Image();
			const url = URL.createObjectURL(artwork);
			try {
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error("Failed to load image"));
					img.src = url;
				});
				// Place the right half's artwork within its viewport (roughly centred);
				// the user can drag to reposition.
				const initialX = half === "B" ? MeldFlatRenderConfigPreset.rightArtworkDragZone.x : 0;
				set((state) => ({
					[key]: {
						...(state[key] as MeldHalf),
						CardArtwork: artwork,
						CardArtPosition: {
							x: initialX,
							y: 0,
							width: img.naturalWidth,
							height: img.naturalHeight,
						},
					},
				}));
			} finally {
				URL.revokeObjectURL(url);
			}
		},

		setMeldHalfArtPosition: (half, position) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardArtPosition: position,
				},
			})),

		setMeldHalfClass: (half, cls) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardClass: cls,
				},
			})),

		setMeldHalfSecondaryClass: (half, cls) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardSecondaryClass: cls,
				},
			})),

		setMeldHalfSubType: (half, sub) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardSubType: sub,
				},
			})),

		setMeldHalfTalent: (half, talent) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardTalent: talent,
				},
			})),

		setMeldHalfText: (half, html, content) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardTextHTML: html,
					CardTextNode: content,
				},
			})),

		setMeldHalfMacroGroup: (half, group) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardMacroGroup: group,
				},
			})),

		setMeldHalfWeapon: (half, weapon) =>
			set((state) => ({
				[half === "A" ? "meldHalfA" : "meldHalfB"]: {
					...(half === "A" ? state.meldHalfA : state.meldHalfB),
					CardWeapon: weapon,
				},
			})),
	})),
);
