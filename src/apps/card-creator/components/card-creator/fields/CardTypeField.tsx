import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import { trackEvent } from "@fabkit/platform/analytics";
import Select from "@fabkit/platform/components/form/Select";
import { type CardType, CardTypes } from "@fabkit/shared/config/cards/types.ts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function CardTypeField() {
	const { t } = useTranslation("card-creator");
	const { CardType, setCardType } = useCardCreator();

	// TODO: invalidate memo when `t`'s language changes?
	const options = useMemo(
		() =>
			(Object.keys(CardTypes) as CardType[]).sort().map((key) => ({
				value: key,
				label: t(CardTypes[key].label),
			})),
		[t],
	);

	const handleChange = (value: CardType) => {
		setCardType(value);
		trackEvent({ name: "card_type_selected", data: { cardType: value } });
	};

	return (
		<Select
			label={t("card_creator.type_label")}
			value={CardType}
			onChange={handleChange}
			options={options}
		/>
	);
}
