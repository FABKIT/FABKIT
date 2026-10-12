import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import ButtonDropdown from "@fabkit/platform/components/form/ButtonDropdown";
import {
	CardTypeFamilies,
	type CardTypeFamily,
	getDefaultVariantForFamily,
	getTypeSelectorEntries,
} from "@fabkit/shared/config/cards/type_families.ts";
import type { CardType } from "@fabkit/shared/config/cards/types.ts";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/** See CardTypeField.tsx (editor) for why family and plain-type entries can
 * share one value space without colliding. */
type TopLevelValue = CardTypeFamily | CardType;

/**
 * Renders the card type field.
 *
 * This is a one-shot picker (value is always null — it navigates away
 * immediately on selection) so, unlike the editor's CardTypeField, it needs
 * no reverse lookup to display a current value. Picking a family (e.g.
 * Equipment) lands on that family's default variant (Normal Equipment); the
 * variant can be changed afterwards in the editor.
 */
export function CardTypeField() {
	const { t } = useTranslation("card-creator");
	const [isLoading, setIsLoading] = useState(false);
	const setCardType = useCardCreator((state) => state.setCardType);
	const reset = useCardCreator((state) => state.reset);
	const navigate = useNavigate();

	// TODO: invalidate memo when `t`'s language changes?
	const options = useMemo(() => {
		return getTypeSelectorEntries()
			.map((entry) => ({
				value: entry.kind === "family" ? entry.family : entry.type,
				label: t(entry.label),
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [t]);

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
			onChange={async (value: TopLevelValue) => {
				setIsLoading(true);

				const type =
					value in CardTypeFamilies
						? getDefaultVariantForFamily(value as CardTypeFamily)
						: (value as CardType);

				reset();
				setCardType(type);
				await navigate({ to: "/card-creator" });
			}}
			options={options}
		/>
	);
}
