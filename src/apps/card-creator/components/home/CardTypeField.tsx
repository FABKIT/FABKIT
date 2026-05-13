import ButtonDropdown from "@fabkit/platform/components/form/ButtonDropdown";
import { CardTypes } from "@fabkit/shared/config/cards/types.ts";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "../../stores/card-creator.ts";

/**
 * Renders the card type field.
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
			Object.keys(CardTypes)
				.sort()
				.map((key) => ({
					value: key,
					label: t(CardTypes[key].label),
				})),
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
				setCardType(type);
				await navigate({ to: "/card-creator" });
			}}
			options={options}
		/>
	);
}
