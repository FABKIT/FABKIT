import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import Select from "../../form/Select.tsx";
import { useIsFieldVisible } from "../../utils.ts";

const pitchOptions = [
	{ label: "1", value: "1" },
	{ label: "2", value: "2" },
	{ label: "3", value: "3" },
];

/**
 * Renders the pitch field.
 */
export function CardPitchField() {
	const { t } = useTranslation();
	const CardPitch = useCardCreator((state) => state.CardPitch);
	const setPitch = useCardCreator((state) => state.setPitch);
	const shouldShow = useIsFieldVisible("CardPitch");

	if (!shouldShow) return null;
	return (
		<Select
			label={t("card_creator.pitch_label")}
			value={`${CardPitch || 1}`}
			onChange={(value) =>
				setPitch(Math.min(Math.max(parseInt(value, 10), 1), 3) as 1 | 2 | 3)
			}
			options={pitchOptions}
		/>
	);
}
