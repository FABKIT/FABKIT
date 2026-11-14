import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { useTranslation } from "react-i18next";

/** Names what makes this copy special, if anything: Marvel takes precedence,
 * otherwise its foil. A plain card shows nothing. */
export function TreatmentBadge({
	card,
	className = "",
}: {
	card: ResolvedCard;
	className?: string;
}) {
	const { t } = useTranslation("pack-opener");

	if (card.rarity === "marvel") {
		return (
			<span className={`${className} font-bold text-pack-marvel`}>
				{t("page.marvel_badge")}
			</span>
		);
	}
	if (card.treatment === "standard") return null;
	return (
		<span className={`${className} font-bold text-pack-foil`}>
			{t(`page.treatment_name.${card.treatment}`)}
		</span>
	);
}
