import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import TextInput from "../../form/TextInput.tsx";
import { useIsFieldVisible } from "../../utils.ts";

export function CardNameField() {
	const { t } = useTranslation();
	const CardName = useCardCreator((state) => state.CardName);
	const setCardName = useCardCreator((state) => state.setCardName);
	const shouldShow = useIsFieldVisible("CardName");

	if (!shouldShow) return null;

	return (
		<TextInput
			label={t("card_creator.name_label")}
			value={CardName || ""}
			onChange={setCardName}
			maxLength={50}
		/>
	);
}
