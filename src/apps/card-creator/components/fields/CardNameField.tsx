import { useTranslation } from "react-i18next";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import TextInput from "../../../../components/form/TextInput.tsx";
import { useIsFieldVisible } from "../utils";

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
