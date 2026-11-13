import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { Button } from "@fabkit/platform/components/Button";
import { useTranslation } from "react-i18next";

interface PackOpenerUnavailableProps {
	error: unknown;
}

/**
 * Route error screen for a first visit with no connection (the app's code isn't
 * precached). Any other error is rethrown to the root error boundary. Renders from the
 * entry chunk, so it must stay free of the store, the scene and three.js.
 */
export function PackOpenerUnavailable({ error }: PackOpenerUnavailableProps) {
	const { t } = useTranslation("pack-opener");

	const isOffline = error instanceof TypeError && !navigator.onLine;
	if (!isOffline) throw error;

	return (
		<div className="flex h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center gap-6 bg-surface px-6 text-center lg:h-dvh">
			<img
				src={CARD_BACK_URL}
				alt=""
				aria-hidden="true"
				className="h-44 w-32 -rotate-3 rounded-lg object-cover opacity-60 shadow-lg grayscale"
			/>
			<div className="flex max-w-md flex-col gap-2">
				<h1 className="text-xl font-bold text-heading">
					{t("unavailable.title")}
				</h1>
				<p className="text-body">{t("unavailable.description")}</p>
			</div>
			<Button onClick={() => window.location.reload()}>
				{t("unavailable.retry")}
			</Button>
		</div>
	);
}
