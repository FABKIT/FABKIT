import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { Button } from "@fabkit/platform/components/Button";
import { useTranslation } from "react-i18next";

/** Every browser words a failed `import()` differently: Chrome, Firefox, then
 * Safari. Matching the message is the only signal there is, since they all
 * throw a plain TypeError. */
const CHUNK_LOAD_FAILURE =
	/dynamically imported module|error loading dynamically imported|Importing a module script failed/i;

interface PackOpenerUnavailableProps {
	error: unknown;
}

/**
 * The route's error screen (see src/routes/pack-opener.tsx). The pack
 * opener's code is not precached, so someone who opens it for the first time
 * with no connection cannot download it. That is not a bug to report, so it
 * gets its own plain message instead of the app-wide crash screen.
 *
 * Anything else is rethrown, which hands it to the root error boundary and
 * its bug-report prompt, exactly as before this component existed.
 *
 * Like PackOpenerLoading, this renders from the entry chunk and must stay
 * free of the store, the scene and three.js.
 */
export function PackOpenerUnavailable({ error }: PackOpenerUnavailableProps) {
	const { t } = useTranslation("pack-opener");

	const isChunkLoadFailure =
		error instanceof Error && CHUNK_LOAD_FAILURE.test(error.message);
	if (!isChunkLoadFailure) throw error;

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
			{/* A full reload rather than a router retry: the router remembers a
			    failed import, and a reload also lets the service worker hand
			    over anything it has cached since. */}
			<Button onClick={() => window.location.reload()}>
				{t("unavailable.retry")}
			</Button>
		</div>
	);
}
