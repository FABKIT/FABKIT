import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import { TogglePill } from "@fabkit/platform/components/form/TogglePill.tsx";
import { useTranslation } from "react-i18next";

export function CardBackStyleField() {
	const { t } = useTranslation("card-creator");
	const CardBackType = useCardCreator((state) => state.CardBackStyle);
	const setCardBackType = useCardCreator((state) => state.setCardBackStyle);

	return (
		<label className="flex items-center gap-2 text-sm">
			<TogglePill>
				<div className="relative w-32 h-9 overflow-hidden rounded-full">
					<input
						type="checkbox"
						className="relative w-full h-full p-0 m-0 opacity-0 cursor-pointer z-[3]"
						checked={CardBackType === "flat"}
						onChange={(event) =>
							setCardBackType(event.target.checked ? "flat" : "dented")
						}
					/>
					<div className="absolute top-0 right-0 bottom-0 left-0 z-[2]">
						<div
							className={`
          absolute top-0.75 w-15 h-7.5 text-[8px]/[30px] font-bold
          text-white text-center bg-primary rounded-full transition-all
          duration-300 ease-in-out
          ${CardBackType === "flat" ? "left-16.25" : "left-0.75"}
        `}
						>
							{CardBackType === "flat"
								? t("card_creator.card_back_style_flat_label")
								: t("card_creator.card_back_style_dented_label")}
						</div>
					</div>
					{/* Background layer that changes color */}
					<div
						className={`
        absolute top-0 right-0 bottom-0 left-0 w-full z-[1]
        transition-colors duration-300 ease-in-out
        ${CardBackType === "flat" ? "bg-slider" : "bg-white"}
      `}
					></div>
				</div>
			</TogglePill>
		</label>
	);
}
