import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { TriangleAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/** The short version of EstimateDisclaimer, shown above the set picker until the
 * visitor closes it. Styled after that callout so the two read as one voice. */
export function BetaNotice() {
	const { t } = useTranslation("pack-opener");
	const dismissed = usePackOpenerStore((state) => state.betaNoticeDismissed);
	const dismissBetaNotice = usePackOpenerStore(
		(state) => state.dismissBetaNotice,
	);

	if (dismissed) return null;

	return (
		<aside className="w-full shrink-0 px-4 pt-2">
			<div className="mx-auto flex max-w-2xl items-start gap-2.5 rounded-lg border border-border-primary bg-surface-muted py-2 pr-1.5 pl-3">
				<TriangleAlert
					className="mt-0.5 h-4 w-4 shrink-0 text-heading"
					aria-hidden="true"
				/>
				<p className="min-w-0 flex-1 text-xs text-body">
					<strong className="font-semibold text-heading">
						{t("beta_notice.title")}
					</strong>{" "}
					{t("beta_notice.body")}
				</p>
				<button
					type="button"
					onClick={dismissBetaNotice}
					aria-label={t("beta_notice.dismiss")}
					className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-surface-active hover:text-heading"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		</aside>
	);
}
