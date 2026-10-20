import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import ButtonDropdown from "@fabkit/platform/components/form/ButtonDropdown";
import { type CardType, CardTypes } from "@fabkit/shared/config/cards/types.ts";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Renders the card type field.
 *
 * Picking a type always starts it as its standard version (no variant); a
 * variant, where the type has any, is chosen afterwards in the editor.
 */
export function CardTypeField() {
	const { t } = useTranslation("card-creator");
	const [isLoading, setIsLoading] = useState(false);
	const setCardType = useCardCreator((state) => state.setCardType);
	const reset = useCardCreator((state) => state.reset);
	const navigate = useNavigate();

	// TODO: invalidate memo when `t`'s language changes?
	const options = useMemo(
		() =>
			(Object.keys(CardTypes) as CardType[])
				.map((key) => ({
					value: key,
					label: t(CardTypes[key].label),
				}))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[t],
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<LoaderCircle className="size-5 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<ButtonDropdown
			placeholder={t("card_creator.type_placeholder")}
			label=""
			value={null}
			onChange={async (type) => {
				setIsLoading(true);

				reset();
				setCardType(type, null);
				await navigate({ to: "/card-creator" });
			}}
			options={options}
		/>
	);
}
