import TextInput from "@fabkit/platform/components/form/TextInput";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";

export function CardArtworkCreditsField() {
	const { t } = useTranslation("card-creator");
	const CardArtworkCredits = useCardCreator(
		(state) => state.CardArtworkCredits,
	);
	const setCardArtworkCredits = useCardCreator(
		(state) => state.setCardArtworkCredits,
	);

	return (
		<TextInput
			label={t("card_creator.artwork_credits_label")}
			value={CardArtworkCredits || ""}
			onChange={setCardArtworkCredits}
			maxLength={50}
		/>
	);
}
