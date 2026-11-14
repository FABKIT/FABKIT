import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { PriceValue } from "@fabkit/apps/pack-opener/components/PriceValue";
import { TreatmentBadge } from "@fabkit/apps/pack-opener/components/TreatmentBadge";
import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { selectActiveCard } from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { FlipHorizontal2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Describes the card on screen: the revisited one if any, else the last revealed.
 * The slot's height is owned by PackOpenerPage so the canvas never resizes. */
export function RevealCaption() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const drawn = usePackOpenerStore(selectActiveCard);
	const phase = usePackOpenerStore((state) => state.phase);
	const showingOtherFace = usePackOpenerStore(
		(state) => state.showingOtherFace,
	);
	const flipCard = usePackOpenerStore((state) => state.flipCard);
	const prices = usePrices();

	if (!drawn || !pack) return null;

	const resolved = resolveCard(drawn, packSetCode);

	/** Price in the selected currency; null renders as "Not priced yet". */
	const price = prices.card(packSetCode, resolved);

	return (
		<div className="flex flex-col items-center gap-1">
			{/* The flip control sits beside the name so it never covers the artwork. */}
			<span className="flex items-center gap-2">
				<span className="font-card-name text-lg text-heading">
					{resolved.name ?? t("card.unavailable")}
				</span>
				{resolved.backImageUrl !== null && (
					<button
						type="button"
						onClick={flipCard}
						aria-pressed={showingOtherFace}
						className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
					>
						<FlipHorizontal2 className="h-3.5 w-3.5" aria-hidden="true" />
						{showingOtherFace ? t("page.see_front") : t("page.see_back")}
					</button>
				)}
			</span>
			<p className="font-card-stat flex items-center gap-2 text-sm text-muted">
				{/* Sits next to its own label, not the card name. */}
				<img
					src={CardRarities[resolved.rarity].icon}
					alt={t(CardRarities[resolved.rarity].label)}
					className="h-4 w-4"
				/>
				<span>{t(CardRarities[resolved.rarity].label)}</span>
				<TreatmentBadge card={resolved} />
				{/* Same line as the rarity: a separate line would resize the fixed-height slot. */}
				<span className="text-subtle" aria-hidden="true">
					·
				</span>
				<span
					className={price === null ? "text-subtle" : "font-bold text-heading"}
				>
					<PriceValue amount={price} />
				</span>
			</p>
			{/* Reveal-only: once the pack is done the summary carries the count. */}
			{phase === "revealing" && (
				<p className="text-sm text-muted">
					{t("page.tap_to_reveal")}
					<span className="text-subtle"> · </span>
					<span className="font-card-stat text-xs text-subtle">
						{revealIndex + 1} / {pack.length}
					</span>
				</p>
			)}
		</div>
	);
}
