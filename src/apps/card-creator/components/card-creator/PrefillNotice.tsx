import {
	dismissPrefillNotice,
	usePrefillNotice,
} from "@fabkit/apps/card-creator/url-params";
import { AlertTriangle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Tells the user which parts of a prefill link the card could not take.
 * Silently dropping them would leave the developer who built the link
 * debugging blind, and refusing the whole link would punish the user for
 * someone else's typo.
 */
export const PrefillNotice = () => {
	const { t } = useTranslation("card-creator");
	const ignored = usePrefillNotice();

	return ignored.length === 0 ? null : (
		<div
			role="status"
			className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500"
		>
			<AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
			<div className="flex-1 space-y-1">
				<p className="font-semibold">{t("card_creator.prefill.title")}</p>
				<ul className="space-y-0.5">
					{ignored.map(({ param, reason }) => (
						<li key={`${param}-${reason}`}>
							{t(`card_creator.prefill.ignored.${reason}`, { param })}
						</li>
					))}
				</ul>
			</div>
			<button
				type="button"
				onClick={dismissPrefillNotice}
				className="shrink-0 rounded-md p-1 transition-colors hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
			>
				<span className="sr-only">{t("card_creator.prefill.dismiss")}</span>
				<X aria-hidden="true" className="h-4 w-4" />
			</button>
		</div>
	);
};
