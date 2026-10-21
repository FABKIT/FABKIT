import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import { trackEvent } from "@fabkit/platform/analytics";
import Select, {
	type SelectOption,
} from "@fabkit/platform/components/form/Select";
import { getVariantOptions } from "@fabkit/shared/config/cards/card_definition.ts";
import { type CardType, CardTypes } from "@fabkit/shared/config/cards/types.ts";
import {
	type CardVariantOrStandard,
	STANDARD_VARIANT,
} from "@fabkit/shared/config/cards/variants.ts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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
		return getVariantOptions(CardType).map(
			(option): SelectOption<CardVariantOrStandard> => ({
				value: option.variant ?? STANDARD_VARIANT,
				label: t(option.label),
			}),
		);
	}, [CardType, t]);

	// Picking a type always lands on its standard version.
	const handleTypeChange = (value: CardType) => {
		setCardType(value, null);
		trackEvent({
			name: "card_type_selected",
			data: { cardType: value, cardVariant: null },
		});
	};

	const handleVariantChange = (value: CardVariantOrStandard) => {
		if (!CardType) return;
		const variant = value === STANDARD_VARIANT ? null : value;
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
