import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CardTypes } from "../../../config/cards.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";
import Select from "../../form/Select.tsx";

/**
 * Renders the card type field.
 */
export function CardTypeField() {
	const { t } = useTranslation();
	const { CardType, setCardType } = useCardCreator();

	// TODO: invalidate memo when `t`'s language changes?
	const options = useMemo(
		() =>
			Object.keys(CardTypes)
				.sort()
				.map((key) => ({
					value: key,
					label: t(CardTypes[key].label),
				})),
		[t],
	);

	return (
		<Select
			label={t("card_creator.type_label")}
			value={CardType || ""}
			onChange={setCardType}
			options={options}
		/>
	);
}
