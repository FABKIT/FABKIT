import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import { trackEvent } from "@fabkit/platform/analytics";
import Select from "@fabkit/platform/components/form/Select";
import { getVariantOptions } from "@fabkit/shared/config/cards/card_definition.ts";
import { type CardType, CardTypes } from "@fabkit/shared/config/cards/types.ts";
import type { CardVariant } from "@fabkit/shared/config/cards/variants.ts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Stand-in for "no variant" in the variant dropdown, whose option values must
 * be strings.
 *
 * It is never stored: it is mapped back to `null` BEFORE setCardType is
 * called, so it can never reach the store or the serializer. It must not
 * collide with any variant key in CardVariants (shared/config/cards/variants.ts).
 */
const STANDARD_VARIANT = "standard";

export function CardTypeField() {
	const { t } = useTranslation("card-creator");
	const CardType = useCardCreator((state) => state.CardType);
	const CardVariant = useCardCreator((state) => state.CardVariant);
	const setCardType = useCardCreator((state) => state.setCardType);

	// TODO: invalidate memo when `t`'s language changes?
	const typeOptions = useMemo(
		() =>
			(Object.keys(CardTypes) as CardType[])
				.map((key) => ({
					value: key,
					label: t(CardTypes[key].label),
				}))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[t],
	);

	// Empty for a card type with no variants, which is what hides the dropdown.
	const variantOptions = useMemo(() => {
		if (!CardType) return [];
		return getVariantOptions(CardType).map((option) => ({
			value: option.variant ?? STANDARD_VARIANT,
			label: t(option.label),
		}));
	}, [CardType, t]);

	// Picking a type always lands on its standard version.
	const handleTypeChange = (value: CardType) => {
		setCardType(value, null);
		trackEvent({
			name: "card_type_selected",
			data: { cardType: value, cardVariant: null },
		});
	};

	const handleVariantChange = (value: string) => {
		if (!CardType) return;
		const variant = value === STANDARD_VARIANT ? null : (value as CardVariant);
		setCardType(CardType, variant);
		trackEvent({
			name: "card_type_selected",
			data: { cardType: CardType, cardVariant: variant },
		});
	};

	return (
		<div className="space-y-4">
			<Select
				label={t("card_creator.type_label")}
				value={CardType}
				onChange={handleTypeChange}
				options={typeOptions}
			/>
			{variantOptions.length > 0 && (
				<Select
					label={t("card_creator.variant_label")}
					value={CardVariant ?? STANDARD_VARIANT}
					onChange={handleVariantChange}
					options={variantOptions}
				/>
			)}
		</div>
	);
}
