import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import TextInput from "../../form/TextInput.tsx";
import { useIsFieldVisible } from "../../utils.ts";

export function CardDefenseField() {
	const { t } = useTranslation();
	const CardDefense = useCardCreator((state) => state.CardDefense);
	const setCardDefense = useCardCreator((state) => state.setCardDefense);
	const shouldShow = useIsFieldVisible("CardDefense");

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.defense_label")}
			value={CardDefense || ""}
			onChange={setCardDefense}
			maxLength={3}
		/>
	);
}
