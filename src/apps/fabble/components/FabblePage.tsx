import { useTranslation } from "react-i18next";

export function FabblePage() {
	const { t } = useTranslation("fabble");
	return (
		<div>
			<h1>{t("coming_soon")}</h1>
		</div>
	);
}
