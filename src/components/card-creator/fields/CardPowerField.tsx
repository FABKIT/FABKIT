import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import TextInput from "../../form/TextInput.tsx";
import { useIsFieldVisible } from "../../utils.ts";

export function CardPowerField() {
	const { t } = useTranslation();
	const CardPower = useCardCreator((state) => state.CardPower);
	const setCardPower = useCardCreator((state) => state.setCardPower);
	const shouldShow = useIsFieldVisible("CardPower");

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.power_label")}
			value={CardPower || ""}
			onChange={setCardPower}
			maxLength={2}
		/>
	);
}
