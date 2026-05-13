// Contains configuration data for FaB cards and related types as well as utility types.
// Re-exports from @fabkit/shared — this barrel remains for backward-compatibility
// during Phase 4 when remaining relative imports are migrated.

export { type CardStyle, CardStyles } from "@fabkit/shared/config/cards/card_styles";
export { type CardClass, CardClasses } from "@fabkit/shared/config/cards/classes";
export type { CardFormField } from "@fabkit/shared/config/cards/form_fields";
export { CardRarities, type CardRarity } from "@fabkit/shared/config/cards/rarities";
export { CardSubtypes } from "@fabkit/shared/config/cards/subtypes";
export { type CardTalent, CardTalents } from "@fabkit/shared/config/cards/talents";
export { type CardType, CardTypes } from "@fabkit/shared/config/cards/types";
