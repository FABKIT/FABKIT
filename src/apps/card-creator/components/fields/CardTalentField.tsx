import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type CardTalent, CardTalents } from "@shared/config/cards";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import { Combobox } from "../../../../components/form/Combobox.tsx";
import type { SelectOption } from "../../../../components/form/Select.tsx";
import { useIsFieldVisible } from "../utils";

export function CardTalentField() {
	const { t } = useTranslation();
	const CardTalent = useCardCreator((state) => state.CardTalent);
	const setCardTalent = useCardCreator((state) => state.setCardTalent);
	const shouldShow = useIsFieldVisible("CardTalent");

	// TODO: invalidate memo when `t`'s language changes?
	const options: SelectOption<CardTalent>[] = useMemo(
		() =>
			Object.keys(CardTalents).map((key) => ({
				value: key as CardTalent,
				label: t(CardTalents[key as CardTalent]),
			})),
		[t],
	);

	if (!shouldShow) return null;
	return (
		<Combobox
			label={t("card_creator.talent_label")}
			value={CardTalent || "none"}
			onChange={setCardTalent}
			options={options}
		/>
	);
}
