import { PackOpenerHUD } from "@fabkit/apps/pack-opener/components/hud/PackOpenerHUD";
import { PackOpenerCanvas } from "@fabkit/apps/pack-opener/components/scene/PackOpenerCanvas";
import { useTranslation } from "react-i18next";

export function PackOpenerPage() {
	const { t } = useTranslation("pack-opener");

	return (
		<div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-black lg:h-dvh">
			<h1 className="sr-only">{t("page.title")}</h1>
			<PackOpenerCanvas />
			<PackOpenerHUD />
		</div>
	);
}
