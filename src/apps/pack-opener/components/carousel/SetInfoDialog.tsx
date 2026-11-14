import { EstimateDisclaimer } from "@fabkit/apps/pack-opener/components/carousel/EstimateDisclaimer";
import { PackContentsSection } from "@fabkit/apps/pack-opener/components/carousel/PackContentsSection";
import { PackSizeSection } from "@fabkit/apps/pack-opener/components/carousel/PackSizeSection";
import { PullRatesSection } from "@fabkit/apps/pack-opener/components/carousel/PullRatesSection";
import { SetPricesSection } from "@fabkit/apps/pack-opener/components/carousel/SetPricesSection";
import { InfoDialog } from "@fabkit/apps/pack-opener/components/PackOpenerDialog";
import { getPackConfig } from "@fabkit/apps/pack-opener/pack/odds";
import { SET_SOURCE_URLS } from "@fabkit/apps/pack-opener/pack/set-configs";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SetInfoDialogProps {
	open: boolean;
	onClose: () => void;
	setCode: string;
	setName: string;
}

/** Pull rates and pack contents are both derived live from the set's own
 * PackConfig (pack/odds.ts), not a separately-authored copy of fabtcg.com's
 * wording — that keeps the dialog impossible to drift out of sync with the
 * actual odds engine. Many of those weights are themselves
 * LSS-published-slot-membership-times-population approximations rather than a
 * confirmed per-rarity split (see pack/set-configs.ts's own extensive
 * comments), and the dialog.estimate_* copy says so in the UI rather than
 * presenting an approximation as a confirmed number. Order asked for by the
 * product owner: rates, then pack contents, then current prices. */
export function SetInfoDialog({
	open,
	onClose,
	setCode,
	setName,
}: SetInfoDialogProps) {
	const { t } = useTranslation("pack-opener");
	const config = getPackConfig(setCode);
	const sourceUrl = SET_SOURCE_URLS[setCode];

	return (
		<InfoDialog open={open} onClose={onClose} title={setName}>
			<PackSizeSection config={config} />
			<PullRatesSection config={config} />
			<EstimateDisclaimer />
			<PackContentsSection config={config} />
			<SetPricesSection setCode={setCode} />

			{sourceUrl && (
				<a
					href={sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-heading"
				>
					<ExternalLink className="h-3.5 w-3.5 shrink-0" />
					{t("dialog.source_link")}
				</a>
			)}
		</InfoDialog>
	);
}
