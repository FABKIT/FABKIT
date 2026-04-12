import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";

export function CardBackStyleField() {
	const { t } = useTranslation();
	const CardBackType = useCardCreator((state) => state.CardBackStyle);
	const setCardBackType = useCardCreator((state) => state.setCardBackStyle);

	return (
		<label className="flex items-center gap-2 text-sm">
			<div className="flex items-center mb-1">
				<div className="h-[36px] m-[10px] shadow-2xl rounded-[20px] bg-white">
					<div className="relative w-[130px] h-[36px] overflow-hidden rounded-[20px]">
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
          absolute top-[3px] w-[60px] h-[30px] text-[8px]/[30px] font-bold 
          text-white text-center bg-primary rounded-[18px] transition-all 
          duration-300 ease-in-out
          ${CardBackType === "flat" ? "left-[67px]" : "left-[3px]"}
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
				</div>
			</div>
		</label>
	);
}
