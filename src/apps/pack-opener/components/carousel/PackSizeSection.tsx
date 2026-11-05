import { guaranteedTokenCount } from "@fabkit/apps/pack-opener/pack/pull-rates";
import type { PackConfig } from "@fabkit/apps/pack-opener/pack/types";
import { useTranslation } from "react-i18next";

/** Shown the way the physical pack counts it: cards, then the token alongside.
 * fabtcg.com counts the token inside its own total, the printed wrapper does
 * not, and a player holding the real pack should not have to work out which of
 * the two numbers this app means. See guaranteedTokenCount for why the
 * underlying cardsPerPack is deliberately left alone. */
export function PackSizeSection({ config }: { config: PackConfig }) {
	const { t } = useTranslation("pack-opener");
	const tokenCount = guaranteedTokenCount(config);

	return (
		<section className="space-y-1">
			<h3 className="font-semibold text-body">
				{t("dialog.cards_per_pack_title")}
			</h3>
			<p className="text-sm text-muted">
				{tokenCount > 0
					? t("dialog.cards_per_pack_with_token", {
							cards: config.cardsPerPack - tokenCount,
							count: tokenCount,
						})
					: config.cardsPerPack}
			</p>
			{tokenCount > 0 && (
				<p className="text-xs text-subtle">
					{t("dialog.cards_per_pack_note", {
						total: config.cardsPerPack,
					})}
				</p>
			)}
		</section>
	);
}
