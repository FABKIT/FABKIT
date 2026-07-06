import { useTranslation } from "react-i18next";

export function TwinToast() {
	const { t } = useTranslation("fabble");

	return (
		<div className="mt-3 rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm text-heading">
			✨ {t("play.twin_message")}
		</div>
	);
}
