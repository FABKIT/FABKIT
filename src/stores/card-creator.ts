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

	/** Sets artist credit text (automatically uppercased) */
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
const initialState: CardCreatorState = {
	__version: uuid(),
	CardType: null,
	CardBack: CardBacks[0],
	CardBackStyle: "dented",
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
			set({ CardArtworkCredits: credits?.toUpperCase() }),
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
		loadCard: (state: Partial<CardCreatorState>) => set(state),
	})),
);
