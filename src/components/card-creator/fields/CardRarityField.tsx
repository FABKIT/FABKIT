import { Field, Label, Radio, RadioGroup } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import {
	CardRarities,
	type CardRarity,
} from "../../../config/cards/rarities.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";
import { useIsFieldVisible } from "../../utils.ts";

export function CardRarityField() {
	const { t } = useTranslation();
	const CardRarity = useCardCreator((state) => state.CardRarity);
	const setCardRarity = useCardCreator((state) => state.setCardRarity);
	const shouldShow = useIsFieldVisible("CardRarity");

	if (!shouldShow) return null;
	return (
		<Field className="space-y-1">
			<Label className="block text-sm font-medium text-muted mb-2">
				{t("card_creator.rarity_label")}
			</Label>
			<RadioGroup
				value={CardRarity ?? undefined}
				onChange={setCardRarity}
				className="flex flex-wrap gap-3"
			>
				{Object.entries(CardRarities).map(([key, rarity]) => (
					<Radio
						key={key}
						value={key as CardRarity}
						className="h-14 w-14 sm:h-10 sm:w-10 rounded-md border-2 transition-all hover:scale-105 focus:outline-none flex items-center justify-center cursor-pointer data-[checked]:border-primary data-[checked]:bg-primary/10 data-[focus]:ring-2 data-[focus]:ring-primary/30 border-border bg-surface hover:border-border-primary"
						title={t(rarity.label)}
					>
						<img
							src={rarity.icon}
							alt=""
							className="h-8 w-8 sm:h-6 sm:w-6 object-contain"
						/>
					</Radio>
				))}
			</RadioGroup>
		</Field>
	);
}
