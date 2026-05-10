import { useTranslation } from "react-i18next";

export function FabblePage() {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
			<h1 className="text-heading text-2xl font-bold">
				{t("fabble.coming_soon_title")}
			</h1>
			<p className="text-body">{t("fabble.coming_soon_body")}</p>
		</div>
	);
}
