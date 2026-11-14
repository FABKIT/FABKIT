import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Deliberately a callout rather than one more line of fine print under the
 * table. The rates are a reconstruction for a good many sets (see
 * pack/set-configs.ts, which shows its working per set), and the product
 * owner's own experience opening real packs does not match what this
 * simulates: runs of multiple Majestics in a pack come up here in a way they
 * do not in a store. Until the per-set odds have been verified properly, the
 * honest thing is to say plainly that these are estimates, that a session here
 * will not behave like real packs, and that none of it is advice about what to
 * buy. */
export function EstimateDisclaimer() {
	const { t } = useTranslation("pack-opener");

	return (
		<section className="space-y-2 rounded-lg border border-border-primary bg-surface-muted p-3.5">
			<h3 className="flex items-center gap-2 font-semibold text-heading">
				<TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
				{t("dialog.estimate_title")}
			</h3>
			<p className="text-xs text-body">{t("dialog.estimate_body_sourced")}</p>
			<p className="text-xs text-body">{t("dialog.estimate_body_not_real")}</p>
			<p className="text-xs text-body">
				{t("dialog.estimate_body_not_advice")}
			</p>
			<p className="text-xs text-subtle">
				{t("dialog.estimate_body_feedback")}
			</p>
		</section>
	);
}
