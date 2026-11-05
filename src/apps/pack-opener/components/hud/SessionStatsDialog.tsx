import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { SessionValueSection } from "@fabkit/apps/pack-opener/components/hud/SessionValueSection";
import { SetRaritySection } from "@fabkit/apps/pack-opener/components/hud/SetRaritySection";
import { InfoDialog } from "@fabkit/apps/pack-opener/components/PackOpenerDialog";
import { usePrices } from "@fabkit/apps/pack-opener/hooks/usePrices";
import { getPackConfig } from "@fabkit/apps/pack-opener/pack/odds";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";
import { computeSessionStats } from "@fabkit/apps/pack-opener/stats/session-stats";
import { getSetIndex } from "@fabkit/shared/data/fab-printings";
import { useTranslation } from "react-i18next";

interface SessionStatsDialogProps {
	open: boolean;
	onClose: () => void;
	openedPacks: OpenedPackRecord[];
}

function shownRarity(card: DrawnCard, setCode: string) {
	return activeCardResolver.resolve(card, setCode).rarity;
}

/** Second dialog on the summary screen. Current-session only: aggregation
 * lives in the pure computeSessionStats (stats/session-stats.ts), fed by the
 * store's flat openedPacksThisSession list, so promoting this to persistent
 * history later only means changing where that list comes from. */
export function SessionStatsDialog({
	open,
	onClose,
	openedPacks,
}: SessionStatsDialogProps) {
	const { t } = useTranslation("pack-opener");
	const prices = usePrices();

	const stats = computeSessionStats(openedPacks, getPackConfig, shownRarity);
	const setNames = new Map(
		getSetIndex().map((entry) => [entry.code, entry.name]),
	);

	return (
		<InfoDialog open={open} onClose={onClose} title={t("stats.title")}>
			{stats.totalPacksOpened === 0 ? (
				<p className="text-sm text-muted">{t("stats.empty")}</p>
			) : (
				<>
					<section className="space-y-1">
						<h3 className="font-semibold text-body">
							{t("stats.packs_opened_label")}
						</h3>
						<p className="text-sm text-muted">{stats.totalPacksOpened}</p>
					</section>

					<SessionValueSection openedPacks={openedPacks} prices={prices} />

					<div className="space-y-4">
						{stats.bySet.map((set) => (
							<SetRaritySection
								key={set.setCode}
								stats={set}
								setName={setNames.get(set.setCode) ?? set.setCode}
							/>
						))}
					</div>
				</>
			)}
		</InfoDialog>
	);
}
