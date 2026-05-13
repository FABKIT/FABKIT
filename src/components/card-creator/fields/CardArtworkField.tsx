import ImageUpload from "@fabkit/platform/components/form/ImageUpload";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";

export function CardArtworkField() {
	const { t } = useTranslation("card-creator");
	const setCardArtwork = useCardCreator((state) => state.setCardArtwork);

	return (
		<div>
			<div className="block text-sm font-medium text-muted mb-1">
				{t("card_creator.artwork_label")}
			</div>
			<ImageUpload onImageSelect={setCardArtwork} />
		</div>
	);
}
