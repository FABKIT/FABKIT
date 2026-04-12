import { useRegisterSW } from "virtual:pwa-register/react";
import { useTranslation } from "react-i18next";

/**
 * Service Worker update notification UI
 * Shows update status at top-center on desktop, full-width on mobile
 */
export function ServiceWorker() {
	const { t } = useTranslation();
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_, registration) {
			// 1h in milliseconds
			const interval = 60 * 60 * 1000;

			registration && setInterval(() => registration.update(), interval);
		},
	});

	if (!needRefresh && !offlineReady) {
		return null;
	}

	return (
		<div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
			<div className="w-full max-w-md md:max-w-lg">
				{/* Offline ready notification */}
				{offlineReady && (
					<div className="bg-surface border border-border-primary rounded-lg shadow-lg p-4">
						<div className="flex flex-col gap-3">
							<div className="flex items-start gap-3">
								<svg
									className="h-5 w-5 text-heading shrink-0 mt-0.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<title>Success</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<p className="text-body text-sm flex-1">
									{t("pwa.offline_ready")}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setOfflineReady(false)}
								className="w-full px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
							>
								{t("pwa.ok")}
							</button>
						</div>
					</div>
				)}

				{/* Update ready notification */}
				{needRefresh && (
					<div className="bg-surface border border-border-primary rounded-lg shadow-lg p-4">
						<div className="flex flex-col gap-3">
							<div className="flex items-start gap-3">
								<svg
									className="h-5 w-5 text-heading shrink-0 mt-0.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<title>Update</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								<p className="text-body text-sm flex-1">
									{t("pwa.update_available")}
								</p>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => updateServiceWorker(true)}
									className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
								>
									{t("pwa.reload")}
								</button>
								<button
									type="button"
									onClick={() => setNeedRefresh(false)}
									className="px-4 py-2 border border-border-primary rounded-md hover:bg-surface-muted transition-colors text-sm font-medium text-body"
								>
									{t("pwa.later")}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
