import { useTranslation } from "react-i18next";

export function IdleOverlay() {
	const { t } = useTranslation("pack-opener");

	return (
		<div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
			<p className="animate-pulse text-lg font-medium text-white drop-shadow">
				{t("page.tap_to_tear")}
			</p>
		</div>
	);
}
