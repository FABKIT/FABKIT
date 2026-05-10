import { useTranslation } from "react-i18next";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import TextInput from "../../../../components/form/TextInput.tsx";

export function CardSetnumberField() {
	const { t } = useTranslation();
	const CardSetNumber = useCardCreator((state) => state.CardSetNumber);
	const setCardSetNumber = useCardCreator((state) => state.setCardSetNumber);

	return (
		<TextInput
			label={t("card_creator.set_number_label")}
			value={CardSetNumber || ""}
			onChange={setCardSetNumber}
			maxLength={7}
		/>
	);
}
