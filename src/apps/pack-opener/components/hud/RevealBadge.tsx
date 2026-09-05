import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function RevealBadge() {
	const { t } = useTranslation("pack-opener");
	const pack = usePackOpenerStore((state) => state.pack);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);

	const drawn =
		pack && revealIndex >= 0 && revealIndex < pack.length
			? pack[revealIndex]
			: null;
	const resolved = useMemo(
		() => (drawn ? activeCardResolver.resolve(drawn) : null),
		[drawn],
	);

	if (!resolved || !pack) return null;

	return (
		<div className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-center">
			<div className="flex items-center gap-2 rounded-full bg-surface/85 px-4 py-2 shadow-lg backdrop-blur">
				<img
					src={CardRarities[resolved.rarity].icon}
					alt=""
					className="h-5 w-5"
				/>
				<span className="font-semibold text-heading">{resolved.name}</span>
				<span className="text-sm text-muted">
					{t(CardRarities[resolved.rarity].label)}
				</span>
				{resolved.marvel && (
					<span className="rounded bg-fuchsia-500/20 px-2 py-0.5 text-xs font-bold text-fuchsia-400">
						{t("page.marvel_badge")}
					</span>
				)}
				{!resolved.marvel && resolved.foil && (
					<span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400">
						{t("page.foil_badge")}
					</span>
				)}
			</div>
			<p className="text-sm text-white/80 drop-shadow">
				{t("page.tap_to_reveal")}
			</p>
			<p className="text-xs text-white/60 drop-shadow">
				{revealIndex + 1} / {pack.length}
			</p>
		</div>
	);
}
