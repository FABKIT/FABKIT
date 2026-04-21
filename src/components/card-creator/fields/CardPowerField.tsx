import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import TextInput from "../../form/TextInput.tsx";
import { useIsFieldVisible } from "../../utils.ts";

export function CardPowerField() {
	const { t } = useTranslation();
	const CardPower = useCardCreator((state) => state.CardPower);
	const setCardPower = useCardCreator((state) => state.setCardPower);
	const CardType = useCardCreator((state) => state.CardType);
	const CardHeroIntellect = useCardCreator((state) => state.CardHeroIntellect);
	const shouldShow = useIsFieldVisible("CardPower");
	const isConflicted = CardType === "meld" && Boolean(CardHeroIntellect);

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.power_label")}
			value={CardPower || ""}
			onChange={setCardPower}
			maxLength={2}
			warning={isConflicted ? t("card_creator.conflict_intellect") : undefined}
		/>
	);
}
