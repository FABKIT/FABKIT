import type { CardBack } from "@fabkit/shared/config/cards/card_backs";
import { MeldFlatRenderConfigPreset } from "./rendering/meld_preset.tsx";
import {
	NormalDentedEquipmentRenderConfigPreset,
	NormalDentedHeroRenderConfigPreset,
	NormalDentedRenderConfigPreset,
	NormalDentedTokenRenderConfigPreset,
	NormalDentedWeaponRenderConfigPreset,
	NormalFlatEquipmentRenderConfigPreset,
	NormalFlatHeroRenderConfigPreset,
	NormalFlatRenderConfigPreset,
	NormalFlatTokenRenderConfigPreset,
	NormalFlatWeaponRenderConfigPreset,
} from "./rendering/preset.tsx";
import type { CardRenderConfig } from "./rendering/types.ts";

export const AllRenderConfigVariations: Record<string, CardRenderConfig> = {
	normal_dented: NormalDentedRenderConfigPreset,
	normal_dented_hero: NormalDentedHeroRenderConfigPreset,
	normal_dented_weapon: NormalDentedWeaponRenderConfigPreset,
	normal_dented_equipment: NormalDentedEquipmentRenderConfigPreset,
	normal_dented_token: NormalDentedTokenRenderConfigPreset,
	normal_flat: NormalFlatRenderConfigPreset,
	normal_flat_hero: NormalFlatHeroRenderConfigPreset,
	normal_flat_weapon: NormalFlatWeaponRenderConfigPreset,
	normal_flat_equipment: NormalFlatEquipmentRenderConfigPreset,
	normal_flat_token: NormalFlatTokenRenderConfigPreset,
	meld_flat: MeldFlatRenderConfigPreset,
};

export type RenderConfigVariation = keyof typeof AllRenderConfigVariations;

// Extends the shared CardBack domain type with the card-creator's renderer key.
// The shared type intentionally omits renderer — it's a card-creator concern.
export interface CardCreatorCardBack extends CardBack {
	renderer: RenderConfigVariation;
}
