import { Combobox } from "@fabkit/platform/components/form/Combobox";
import type { SelectOption } from "@fabkit/platform/components/form/Select";
import {
	type CardTalent,
	CardTalents,
} from "@fabkit/shared/config/cards/talents.ts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import { useIsFieldVisible } from "../../utils.ts";

export function CardTalentField() {
	const { t } = useTranslation("card-creator");
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
