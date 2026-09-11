import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { formatUsd } from "@fabkit/apps/pack-opener/lib/currency";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { getCardPrice } from "@fabkit/shared/data/fab-prices";
import { FlipHorizontal2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/** What the card currently on screen actually is — in normal document flow
 * BELOW the 3D canvas and ABOVE the summary (see PackOpenerPage.tsx),
 * never an overlay sitting on top of the card itself.
 *
 * Shown for the whole of both card-bearing phases, not just the reveal. It
 * used to disappear the moment the summary arrived, which left the last
 * card of a pack — and every card opened from the ledger afterwards —
 * sitting there unlabelled. Whatever card the scene is showing, this
 * describes it: the one being revisited if there is one, otherwise the
 * last one revealed. The tap prompt and the running count are the only
 * parts specific to the reveal itself.
 *
 * The fixed-height slot it sits in is owned by PackOpenerPage, not by this
 * component: the reveal shows one line more than the done phase does, and
 * if the block were free to resize, the canvas above it would resize with
 * it and the card would change size at exactly the moment the summary
 * appears — the thing that layout exists to prevent. */
export function RevealCaption() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const phase = usePackOpenerStore((state) => state.phase);
	const showingOtherFace = usePackOpenerStore(
		(state) => state.showingOtherFace,
	);
	const flipCard = usePackOpenerStore((state) => state.flipCard);

	const activeIndex =
		revisitIndex !== null && phase === "done" ? revisitIndex : revealIndex;

	const drawn =
		pack && activeIndex >= 0 && activeIndex < pack.length
			? pack[activeIndex]
			: null;
	const resolved = useMemo(
		() =>
			drawn
				? activeCardResolver.resolve(drawn, packSetCode ?? undefined)
				: null,
		[drawn, packSetCode],
	);

	/** The same build-time snapshot the summary totals up, read one card
	 * at a time (see shared/data/fab-prices.ts). Keyed by printing and
	 * foiling, so the Red of a card and its Yellow are priced separately,
	 * as are a standard copy and its Rainbow Foil. No price is a real and
	 * fairly common state — roughly one printing in twenty-five is not in
	 * the snapshot — so it says so rather than showing a zero. */
	const price = useMemo(
		() =>
			resolved?.tcgplayerProductId && packSetCode
				? getCardPrice(
						packSetCode,
						resolved.tcgplayerProductId,
						resolved.treatment,
					)
				: null,
		[resolved, packSetCode],
	);

	if (!resolved || !pack) return null;

	return (
		<div className="flex flex-col items-center gap-1">
			{/* Card names in the real FAB card-name face — section 3.7's
			    "the game's own face for the game's own content". */}
			{/* The flip control sits beside the name rather than over the card
			    so it can never cover the artwork it exists to reveal, and
			    appears only for the double-faced cards that actually have
			    another side (see card-resolver.ts's backImageUrl). */}
			<span className="flex items-center gap-2">
				<span className="font-card-name text-lg text-heading">
					{resolved.name}
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
				{/* Rarity symbol sits directly next to its own label (the C
				    before "Common", and so on). It used to sit next to the card
				    name instead, which read as decorating the name rather than
				    labelling the rarity underneath it. */}
				<img
					src={CardRarities[resolved.rarity].icon}
					alt=""
					className="h-4 w-4"
				/>
				<span>{t(CardRarities[resolved.rarity].label)}</span>
				{resolved.rarity === "marvel" && (
					<span className="font-bold text-pack-marvel">
						{t("page.marvel_badge")}
					</span>
				)}
				{resolved.rarity !== "marvel" && resolved.treatment !== "standard" && (
					<span className="font-bold text-pack-foil">
						{t(`page.treatment_name.${resolved.treatment}`)}
					</span>
				)}
				{/* Price rides on the rarity line rather than getting a line of
				    its own: this block sits in a fixed-height slot owned by
				    PackOpenerPage, and adding a line would resize the canvas
				    above it and change the card's size mid-pack. The separator
				    keeps it from reading as part of the rarity itself. */}
				<span className="text-subtle" aria-hidden="true">
					·
				</span>
				<span
					className={price === null ? "text-subtle" : "font-bold text-heading"}
				>
					{price === null ? t("summary.price_unavailable") : formatUsd(price)}
				</span>
			</p>
			{/* Reveal-only. Once the pack is done there is nothing left to tap
			    through, and the summary below carries the count instead. There
			    is deliberately no "back to summary" control: the summary sits
			    right underneath, collapsed to its header, and expanding it is
			    what reopens the ledger (see PackSummary.tsx). */}
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
