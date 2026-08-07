import Slider from "@fabkit/platform/components/form/Slider";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";

/**
 * Softness control for the hybrid seam.
 * Rendered inside the card back picker so it reads as part of the same control
 * and costs almost no vertical space — the card preview has to stay fully
 * visible on a standard desktop screen. Seam *position* has a natural drag
 * gesture on the preview; softness does not, so it lives here.
 *
 * Returns null unless hybrid is active — there is no seam to soften otherwise.
 */
export function HybridBlendField() {
	const { t } = useTranslation("card-creator");
	const CardBackRight = useCardCreator((state) => state.CardBackRight);
	const CardBackBlend = useCardCreator((state) => state.CardBackBlend);
	const setCardBackBlend = useCardCreator((state) => state.setCardBackBlend);

	if (CardBackRight === null) return null;

	return (
		<div className="flex items-center gap-2 px-2 pt-1.5 pb-0.5">
			<span className="shrink-0 text-xs font-medium text-muted">
				{t("card_creator.hybrid_blend_label")}
			</span>
			<div className="flex-1">
				<Slider
					label={t("card_creator.hybrid_blend_label")}
					hideLabel
					value={CardBackBlend}
					onChange={setCardBackBlend}
					min={0}
					max={1}
					step={0.01}
				/>
			</div>
		</div>
	);
}
