import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import { trackEvent } from "@fabkit/platform/analytics";
import Select from "@fabkit/platform/components/form/Select";
import {
	CardTypeFamilies,
	type CardTypeFamily,
	getDefaultVariantForFamily,
	getFamilyForCardType,
	getTypeSelectorEntries,
} from "@fabkit/shared/config/cards/type_families.ts";
import type { CardType } from "@fabkit/shared/config/cards/types.ts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * A family entry and a plain-type entry share one dropdown, so both need a
 * single string value space. A family's representative value is its own key
 * (e.g. "equipment"); a plain type's is the CardType itself. These never
 * collide — getTypeSelectorEntries() excludes any CardType that belongs to a
 * family from the plain-type list.
 */
type TopLevelValue = CardTypeFamily | CardType;

export function CardTypeField() {
	const { t } = useTranslation("card-creator");
	const { CardType, setCardType } = useCardCreator();

	// TODO: invalidate memo when `t`'s language changes?
	const topLevelOptions = useMemo(() => {
		return getTypeSelectorEntries()
			.map((entry) => ({
				value: entry.kind === "family" ? entry.family : entry.type,
				label: t(entry.label),
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [t]);

	const currentFamily = CardType ? getFamilyForCardType(CardType) : null;
	const topLevelValue: TopLevelValue | null = currentFamily ?? CardType;

	const variantOptions = useMemo(() => {
		if (!currentFamily) return [];
		return CardTypeFamilies[currentFamily].variants.map((variant) => ({
			value: variant.type,
			label: t(variant.label),
		}));
	}, [currentFamily, t]);

	const handleTopLevelChange = (value: TopLevelValue) => {
		const nextType =
			value in CardTypeFamilies
				? getDefaultVariantForFamily(value as CardTypeFamily)
				: (value as CardType);
		setCardType(nextType);
		trackEvent({ name: "card_type_selected", data: { cardType: nextType } });
	};

	const handleVariantChange = (value: CardType) => {
		setCardType(value);
		trackEvent({ name: "card_type_selected", data: { cardType: value } });
	};

	return (
		<div className="space-y-4">
			<Select
				label={t("card_creator.type_label")}
				value={topLevelValue}
				onChange={handleTopLevelChange}
				options={topLevelOptions}
			/>
			{currentFamily && (
				<Select
					label={t("card_creator.variant_label")}
					value={CardType}
					onChange={handleVariantChange}
					options={variantOptions}
				/>
			)}
		</div>
	);
}
