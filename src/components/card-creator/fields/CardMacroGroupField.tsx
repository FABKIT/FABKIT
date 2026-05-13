import TextInput from "@fabkit/platform/components/form/TextInput";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import { useIsFieldVisible } from "../../utils.ts";

export function CardMacroGroupField() {
	const { t } = useTranslation("card-creator");
	const CardMacroGroup = useCardCreator((state) => state.CardMacroGroup);
	const setCardMacroGroup = useCardCreator((state) => state.setCardMacroGroup);
	const shouldShow = useIsFieldVisible("CardMacroGroup");

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.macro_group_label")}
			value={CardMacroGroup || ""}
			onChange={setCardMacroGroup}
		/>
	);
}
