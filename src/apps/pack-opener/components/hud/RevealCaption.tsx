import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { PriceValue } from "@fabkit/apps/pack-opener/components/PriceValue";
import { TreatmentBadge } from "@fabkit/apps/pack-opener/components/TreatmentBadge";
import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import {
	selectActiveCard,
	selectActiveIndex,
} from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { FlipHorizontal2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Below `md` the name shares its row with the step buttons, so a long one steps
 * down in size, and the longest also wrap onto a second line, rather than being
 * cut off. The tight leading keeps two lines inside the caption's fixed height. */
function nameSizeBelowMd(name: string): string {
	if (name.length > 26) return "text-sm leading-tight";
	if (name.length > 20) return "text-base leading-tight";
	return "text-lg";
}

/** Describes the card on screen: the revisited one if any, else the last revealed.
 * The slot's height is owned by PackOpenerPage so the canvas never resizes. */
export function RevealCaption() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const activeIndex = usePackOpenerStore(selectActiveIndex);
	const drawn = usePackOpenerStore(selectActiveCard);
	const phase = usePackOpenerStore((state) => state.phase);
	const showingOtherFace = usePackOpenerStore(
		(state) => state.showingOtherFace,
	);
	const flipCard = usePackOpenerStore((state) => state.flipCard);
	const prices = usePrices();

	if (!drawn || !pack) return null;

	const resolved = resolveCard(drawn, packSetCode);
	const name = resolved.name ?? t("card.unavailable");

	/** Price in the selected currency; null renders as "Not priced yet". */
	const price = prices.card(packSetCode, resolved);

	return (
		// Takes the room between the step buttons below `md`.
		<div className="flex min-w-0 flex-1 flex-col items-center gap-1 md:flex-none">
			{/* The flip control sits beside the name so it never covers the artwork. */}
			<span className="flex max-w-full items-center gap-2">
				<span
					className={`font-card-name min-w-0 text-balance text-heading md:text-lg md:leading-7 ${nameSizeBelowMd(name)}`}
				>
					{name}
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
			{/* The prompt is reveal-only; the position stays for browsing a finished pack. */}
			{/* On its own the position needs less height than the prompt's line,
			    which leaves the room a two-line name takes. */}
			<p
				className={`text-sm text-muted ${phase === "revealing" ? "" : "leading-4"}`}
			>
				{phase === "revealing" && (
					<>
						{t("page.tap_to_reveal")}
						<span className="text-subtle"> · </span>
					</>
				)}
				<span className="font-card-stat text-xs text-subtle">
					{activeIndex + 1} / {pack.length}
				</span>
			</p>
		</div>
	);
}
