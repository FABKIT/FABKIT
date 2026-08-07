import { TogglePill } from "@fabkit/platform/components/form/TogglePill.tsx";
import { getCardBacksForTypeAndStyle } from "@fabkit/shared/config/cards/card_backs.ts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";

/**
 * Activate/deactivate button for hybrid card frames.
 * Hidden entirely for meld cards — meld has its own dedicated frames and a
 * card that's already two halves being split into two more halves would be
 * confusing. Disabled when the current card type/style has fewer than two
 * frames available, since a hybrid needs two different frames to mean anything.
 */
export function HybridCardBackField() {
	const { t } = useTranslation("card-creator");
	const CardType = useCardCreator((state) => state.CardType);
	const CardBackStyle = useCardCreator((state) => state.CardBackStyle);
	const CardBackRight = useCardCreator((state) => state.CardBackRight);
	const toggleHybrid = useCardCreator((state) => state.toggleHybrid);

	const available = useMemo(
		() => getCardBacksForTypeAndStyle(CardType, CardBackStyle),
		[CardType, CardBackStyle],
	);

	if (CardType === "meld") return null;

	const isHybrid = CardBackRight !== null;

	return (
		// Transparent shell while off — the button blends into the page instead of
		// sitting on its own white pill. Filled shell (matching the style switch)
		// once hybrid is active.
		<TogglePill transparent={!isHybrid}>
			<button
				type="button"
				onClick={toggleHybrid}
				disabled={available.length < 2}
				aria-pressed={isHybrid}
				className={`
					flex items-center justify-center w-24 h-9 px-3 rounded-full text-xs font-bold
					transition-colors duration-300 ease-in-out
					disabled:opacity-50 disabled:cursor-not-allowed
					${isHybrid ? "bg-primary text-white" : "bg-transparent border-2 border-primary text-primary"}
				`}
			>
				{t("card_creator.hybrid_toggle_label")}
			</button>
		</TogglePill>
	);
}
