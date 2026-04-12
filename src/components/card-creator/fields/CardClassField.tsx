import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type CardClass, CardClasses } from "../../../config/cards/classes.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";
import { Combobox } from "../../form/Combobox.tsx";
import type { SelectOption } from "../../form/Select.tsx";
import { useIsFieldVisible } from "../../utils.ts";

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
