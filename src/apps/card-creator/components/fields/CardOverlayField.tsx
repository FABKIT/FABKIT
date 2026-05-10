import { useTranslation } from "react-i18next";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import ImageUpload from "../../../../components/form/ImageUpload.tsx";

export function CardOverlayField() {
	const { t } = useTranslation();
	const setOverlay = useCardCreator((state) => state.setOverlay);

	return (
		<div>
			<div className="block text-sm font-medium text-muted mb-1">
				{t("card_creator.overlay_label")}
			</div>
			<ImageUpload onImageSelect={setOverlay} />
		</div>
	);
}
