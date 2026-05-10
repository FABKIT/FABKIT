import { useTranslation } from "react-i18next";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import TextInput from "../../../../components/form/TextInput.tsx";
import { useIsFieldVisible } from "../utils";

export function CardResourceField() {
	const { t } = useTranslation();
	const CardResource = useCardCreator((state) => state.CardResource);
	const setCardResource = useCardCreator((state) => state.setCardResource);
	const shouldShow = useIsFieldVisible("CardResource");

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.resource_label")}
			value={CardResource || ""}
			onChange={setCardResource}
			maxLength={2}
		/>
	);
}
