import { Save } from "lucide-react";
import type { RefObject } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { convertToImage } from "../../../export";
import {
	getCard,
	saveCard,
	updateCard,
} from "../../../persistence/card-storage";
import { useCardCreator } from "../../../stores/card-creator";

interface SaveButtonProps {
	previewRef: RefObject<SVGSVGElement | null>;
}

export function SaveButton({ previewRef }: SaveButtonProps) {
	const { t } = useTranslation();
	const [isSaving, setIsSaving] = useState(false);
	const state = useCardCreator();

	const handleSave = async () => {
		// Validate CardName exists
		if (!state.CardName || state.CardName.trim() === "") {
			alert(t("card_creator.save_error_no_name"));
			return;
		}

		// Validate preview ref exists
		if (!previewRef.current) {
			alert(t("card_creator.save_error"));
			return;
		}

		setIsSaving(true);

		try {
			// Generate thumbnail preview (40% scale)
			const thumbnail = await convertToImage(previewRef.current, 0.4);

			// Check if card exists by __version
			const existingCard = await getCard(state.__version);

			if (existingCard) {
				// Update existing card
				await updateCard(state.__version, state, thumbnail);
			} else {
				// Save new card
				await saveCard(state.CardName, state, thumbnail);
			}

			alert(t("card_creator.save_success"));
		} catch (error) {
			console.error("Failed to save card:", error);
			alert(t("card_creator.save_error"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleSave}
			disabled={isSaving || !state.CardName}
			className="inline-flex items-center justify-center gap-x-1.5 bg-primary text-sm font-semibold text-white rounded-md px-3.5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<Save className="h-4 w-4" />
			{isSaving ? t("card_creator.saving") : t("card_creator.save")}
		</button>
	);
}
