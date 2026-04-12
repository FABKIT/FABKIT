import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import TextInput from "../../form/TextInput.tsx";
import { useIsFieldVisible } from "../../utils.ts";

export function CardLifeField() {
	const { t } = useTranslation();
	const CardLife = useCardCreator((state) => state.CardLife);
	const setCardLife = useCardCreator((state) => state.setCardLife);
	const shouldShow = useIsFieldVisible("CardLife");

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.life_label")}
			value={CardLife || ""}
			onChange={setCardLife}
			maxLength={2}
		/>
	);
}
