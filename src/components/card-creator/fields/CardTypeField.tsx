import Select from "@fabkit/platform/components/form/Select";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CardTypes } from "@fabkit/shared/config/cards/types.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";

/**
 * Renders the card type field.
 */
export function CardTypeField() {
	const { t } = useTranslation("card-creator");
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
