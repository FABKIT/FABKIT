import { SetCarousel } from "@fabkit/apps/pack-opener/components/carousel/SetCarousel";
import { PackOpenerHUD } from "@fabkit/apps/pack-opener/components/hud/PackOpenerHUD";
import { RevealCaption } from "@fabkit/apps/pack-opener/components/hud/RevealCaption";
import { PackOpenerCanvas } from "@fabkit/apps/pack-opener/components/scene/PackOpenerCanvas";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useTranslation } from "react-i18next";

export function PackOpenerPage() {
	const { t } = useTranslation("pack-opener");
	const phase = usePackOpenerStore((state) => state.phase);

	return (
		<div className="relative flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden bg-surface lg:h-dvh">
			<h1 className="sr-only">{t("page.title")}</h1>
			{/* The canvas area shrinks to make room for the caption below it
			    (min-h-0 is what lets a flex child actually shrink below its
			    content size) rather than the caption floating on top of the
			    card — see the execution plan, section 3.8. */}
			<div className="relative min-h-0 flex-1">
				{/* Desk-lamp glow behind the card — reads as a soft pool of light
				    in both themes, and keeps a flat surface color from looking
				    like a bug behind the unlit 3D card. */}
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
			{phase === "revealing" && <RevealCaption />}
		</div>
	);
}
