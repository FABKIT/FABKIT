import Slider from "@fabkit/platform/components/form/Slider";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";

export function CardOverlayOpacityField() {
	const { t } = useTranslation("card-creator");
	const CardOverlay = useCardCreator((state) => state.CardOverlay);
	const CardOverlayOpacity = useCardCreator(
		(state) => state.CardOverlayOpacity,
	);
	const setOverlayOpacity = useCardCreator((state) => state.setOverlayOpacity);

	if (CardOverlay === null) return null;
	return (
		<Slider
			label={t("card_creator.overlay_opacity_label", {
				value: CardOverlayOpacity,
			})}
			value={CardOverlayOpacity}
			onChange={setOverlayOpacity}
			min={0}
			max={1}
			step={0.01}
			formatValue={(value) => `${Math.round(value * 100)}%`}
		/>
	);
}
