import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import ImageUpload from "../../form/ImageUpload.tsx";

export function CardArtworkField() {
	const { t } = useTranslation();
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
