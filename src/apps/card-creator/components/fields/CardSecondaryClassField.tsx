import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type CardClass, CardClasses } from "@shared/config/cards/classes";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import { Combobox } from "../../../../components/form/Combobox.tsx";
import type { SelectOption } from "../../../../components/form/Select.tsx";
import { useIsFieldVisible } from "../utils";

export function CardSecondaryClassField() {
	const { t } = useTranslation();
	const CardSecondaryClass = useCardCreator(
		(state) => state.CardSecondaryClass,
	);
	const setCardSecondaryClass = useCardCreator(
		(state) => state.setCardSecondaryClass,
	);
	const shouldShow = useIsFieldVisible("CardSecondaryClass");

	// TODO: invalidate memo when `t`'s language changes?
	const options: SelectOption<CardClass>[] = useMemo(
		() =>
			Object.keys(CardClasses).map((key) => ({
				value: key as CardClass,
				label: t(CardClasses[key as CardClass]),
			})),
		[t],
	);

	if (!shouldShow) return null;
	return (
		<Combobox
			label={t("card_creator.secondary_class_label")}
			value={CardSecondaryClass || "none"}
			onChange={setCardSecondaryClass}
			options={options}
		/>
	);
}
