import { Field, Label, Radio, RadioGroup } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../../stores/card-creator.ts";
import { useIsFieldVisible } from "../../utils.ts";

export function CardWeaponField() {
	const { t } = useTranslation();
	const CardWeapon = useCardCreator((state) => state.CardWeapon);
	const setCardWeapon = useCardCreator((state) => state.setCardWeapon);
	const shouldShow = useIsFieldVisible("CardWeapon");

	if (!shouldShow) return null;
	return (
		<Field className="space-y-1">
			<Label className="block text-sm font-medium text-muted">
				{t("card_creator.weapon_label")}
			</Label>
			<RadioGroup
				value={CardWeapon ?? undefined}
				onChange={setCardWeapon}
				className="mt-2 grid grid-cols-2 gap-6"
			>
				<Radio
					value="(1H)"
					className="flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold uppercase cursor-pointer focus:outline-none data-[checked]:bg-primary data-[checked]:text-white data-[focus]:ring-2 data-[focus]:ring-primary/30 bg-surface border border-border hover:border-border-primary transition-all"
				>
					1H
				</Radio>
				<Radio
					value="(2H)"
					className="flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold uppercase cursor-pointer focus:outline-none data-[checked]:bg-primary data-[checked]:text-white data-[focus]:ring-2 data-[focus]:ring-primary/30 bg-surface border border-border hover:border-border-primary transition-all"
				>
					2H
				</Radio>
			</RadioGroup>
		</Field>
	);
}
