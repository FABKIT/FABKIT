import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type CardClass, CardClasses } from "@shared/config/cards/classes";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import { Combobox } from "../../../../components/form/Combobox.tsx";
import type { SelectOption } from "../../../../components/form/Select.tsx";
import { useIsFieldVisible } from "../utils";

export function CardClassField() {
	const { t } = useTranslation();
	const CardClass = useCardCreator((state) => state.CardClass);
	const setCardClass = useCardCreator((state) => state.setCardClass);
	const shouldShow = useIsFieldVisible("CardClass");

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
			label={t("card_creator.class_label")}
			value={CardClass || "none"}
			onChange={setCardClass}
			options={options}
		/>
	);
}
