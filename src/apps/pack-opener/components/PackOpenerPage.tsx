import { SetCarousel } from "@fabkit/apps/pack-opener/components/carousel/SetCarousel";
import { PackOpenerHUD } from "@fabkit/apps/pack-opener/components/hud/PackOpenerHUD";
import { PackOpenerCanvas } from "@fabkit/apps/pack-opener/components/scene/PackOpenerCanvas";
import { useTranslation } from "react-i18next";

export function PackOpenerPage() {
	const { t } = useTranslation("pack-opener");

	return (
		<div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-surface lg:h-dvh">
			<h1 className="sr-only">{t("page.title")}</h1>
			{/* Desk-lamp glow behind the card — reads as a soft pool of light in
			    both themes, and keeps a flat surface color from looking like a
			    bug behind the unlit 3D card. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 50% 45%, var(--color-surface-muted), transparent 70%)",
				}}
			/>
			<PackOpenerCanvas />
			<PackOpenerHUD />
			<SetCarousel />
		</div>
	);
}
