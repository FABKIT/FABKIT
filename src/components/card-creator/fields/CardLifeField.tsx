import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import TextInput from "../../form/TextInput.tsx";
import { useIsFieldVisible } from "../../utils.ts";

export function CardLifeField() {
	const { t } = useTranslation();
	const CardLife = useCardCreator((state) => state.CardLife);
	const setCardLife = useCardCreator((state) => state.setCardLife);
	const CardType = useCardCreator((state) => state.CardType);
	const CardDefense = useCardCreator((state) => state.CardDefense);
	const shouldShow = useIsFieldVisible("CardLife");
	const isConflicted = CardType === "meld" && Boolean(CardDefense);

	if (!shouldShow) return null;
	return (
		<TextInput
			label={t("card_creator.life_label")}
			value={CardLife || ""}
			onChange={setCardLife}
			maxLength={2}
			warning={isConflicted ? t("card_creator.conflict_defense") : undefined}
		/>
	);
}
