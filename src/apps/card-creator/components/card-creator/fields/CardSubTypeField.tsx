import { Combobox } from "@fabkit/platform/components/form/Combobox";
import type { SelectOption } from "@fabkit/platform/components/form/Select";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CardSubtypes } from "@fabkit/shared/config/cards/subtypes.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";
import { useIsFieldVisible } from "../../utils.ts";

export function CardSubTypeField() {
	const { t } = useTranslation("card-creator");
	const CardType = useCardCreator((state) => state.CardType);
	const CardSubType = useCardCreator((state) => state.CardSubType);
	const setCardSubType = useCardCreator((state) => state.setCardSubType);
	const shouldShow = useIsFieldVisible("CardSubType");

	const options: SelectOption<string>[] = useMemo(() => {
		if (!CardType) return [];

		const subtypes = CardSubtypes[CardType];
		return Object.keys(subtypes).map((key) => ({
			value: key,
			label: t(subtypes[key]),
		}));
	}, [CardType, t]);

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
