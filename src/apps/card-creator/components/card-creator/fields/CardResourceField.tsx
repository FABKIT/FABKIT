import { useIsFieldVisible } from "@fabkit/apps/card-creator/components/utils.ts";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import TextInput from "@fabkit/platform/components/form/TextInput";
import { useTranslation } from "react-i18next";

export function CardResourceField() {
	const { t } = useTranslation("card-creator");
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
