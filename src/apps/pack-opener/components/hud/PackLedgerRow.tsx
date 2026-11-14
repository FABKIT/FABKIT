import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { PriceValue } from "@fabkit/apps/pack-opener/components/PriceValue";
import { TreatmentBadge } from "@fabkit/apps/pack-opener/components/TreatmentBadge";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useTranslation } from "react-i18next";

interface PackLedgerRowProps {
	card: ResolvedCard;
	price: number | null;
	isShowing: boolean;
	onSelect: () => void;
}

/** One pulled card. The row whose card is currently on screen stays marked, so
 * reopening the ledger shows at a glance which one you were looking at. */
export function PackLedgerRow({
	card,
	price,
	isShowing,
	onSelect,
}: PackLedgerRowProps) {
	const { t } = useTranslation("pack-opener");

	return (
		<li>
			<button
				type="button"
				onClick={onSelect}
				className={`flex w-full items-center gap-3 rounded-lg border px-2 py-1.5 text-left transition hover:border-border-primary hover:bg-surface-muted ${
					isShowing
						? "border-border-primary bg-surface-active"
						: "border-transparent"
				}`}
			>
				<img
					src={CardRarities[card.rarity].icon}
					alt={t(CardRarities[card.rarity].label)}
					className="h-5 w-5 shrink-0"
				/>
				<span className="font-card-name flex-1 truncate text-sm text-body">
					{card.name ?? t("card.unavailable")}
				</span>
				<TreatmentBadge card={card} className="shrink-0 text-xs" />
				<span className="font-card-stat shrink-0 text-sm text-subtle">
					<PriceValue amount={price} />
				</span>
			</button>
		</li>
	);
}
