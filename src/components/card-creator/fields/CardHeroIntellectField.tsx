import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import TextInput from "../../form/TextInput.tsx";
import { useIsFieldVisible } from "../../utils.ts";

export function CardHeroIntellectField() {
	const { t } = useTranslation();
	const CardHeroIntellect = useCardCreator((state) => state.CardHeroIntellect);
	const setCardHeroIntellect = useCardCreator(
		(state) => state.setCardHeroIntellect,
	);
	const shouldShow = useIsFieldVisible("CardHeroIntellect");

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.hero_intellect_label")}
			value={CardHeroIntellect || ""}
			onChange={setCardHeroIntellect}
			maxLength={2}
		/>
	);
}
