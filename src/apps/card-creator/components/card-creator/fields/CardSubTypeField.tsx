import { useIsFieldVisible } from "@fabkit/apps/card-creator/components/utils.ts";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import { Combobox } from "@fabkit/platform/components/form/Combobox";
import type { SelectOption } from "@fabkit/platform/components/form/Select";
import { getCardSubtypes } from "@fabkit/shared/config/cards/card_definition.ts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function CardSubTypeField() {
	const { t } = useTranslation("card-creator");
	const CardType = useCardCreator((state) => state.CardType);
	const CardVariant = useCardCreator((state) => state.CardVariant);
	const CardSubType = useCardCreator((state) => state.CardSubType);
	const setCardSubType = useCardCreator((state) => state.setCardSubType);
	const shouldShow = useIsFieldVisible("CardSubType");

	const options: SelectOption<string>[] = useMemo(() => {
		if (!CardType) return [];

		const subtypes = getCardSubtypes(CardType, CardVariant);
		return Object.keys(subtypes).map((key) => ({
			value: key,
			label: t(subtypes[key]),
		}));
	}, [CardType, CardVariant, t]);

	if (!shouldShow) return null;
	return (
		<Combobox
			label={t("card_creator.subtype_label")}
			value={CardSubType || "none"}
			onChange={setCardSubType}
			options={options}
		/>
	);
}
