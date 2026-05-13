import { useTranslation } from "react-i18next";

const mode = import.meta.env.MODE;

export function DevBanner() {
	const { t } = useTranslation("platform");
	if (mode !== "staging") return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 bg-red-600 text-white text-center text-xs font-bold py-1 tracking-widest uppercase pointer-events-none opacity-80">
			{t("dev_banner.text")}
		</div>
	);
}
