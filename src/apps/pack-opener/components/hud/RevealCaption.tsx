import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/** Replaces RevealBadge — same information, but in normal document flow
 * BELOW the 3D canvas (see PackOpenerPage.tsx) rather than an absolutely
 * positioned overlay sitting on top of the card. RevealBadge's
 * `absolute bottom-10` placement overlapped the bottom of the card itself,
 * which the execution plan (section 3.8) calls out explicitly as something
 * to fix, not preserve: "The caption block sits entirely below the card,
 * never overlapping it." */
export function RevealCaption() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const phase = usePackOpenerStore((state) => state.phase);
	const exitRevisit = usePackOpenerStore((state) => state.exitRevisit);

	const isRevisiting = phase === "done" && revisitIndex !== null;
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

	if (!resolved || !pack) return null;

	return (
		<div className="flex shrink-0 flex-col items-center gap-1 px-4 py-4 text-center">
			<div className="flex items-center gap-2">
				<img
					src={CardRarities[resolved.rarity].icon}
					alt=""
					className="h-5 w-5"
				/>
				{/* Card names in the real FAB card-name face — section 3.7's
				    "the game's own face for the game's own content". */}
				<span className="font-card-name text-lg text-heading">
					{resolved.name}
				</span>
			</div>
			<p className="font-card-stat flex items-center gap-2 text-sm text-muted">
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
			</p>
			{isRevisiting ? (
				<button
					type="button"
					onClick={exitRevisit}
					className="text-sm font-semibold text-heading underline-offset-2 hover:underline"
				>
					{t("page.back_to_summary")}
				</button>
			) : (
				<>
					<p className="text-sm text-muted">{t("page.tap_to_reveal")}</p>
					<p className="text-xs text-subtle">
						{revealIndex + 1} / {pack.length}
					</p>
				</>
			)}
		</div>
	);
}
