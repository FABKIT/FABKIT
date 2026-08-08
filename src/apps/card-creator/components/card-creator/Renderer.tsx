import { MeldRenderer } from "@fabkit/apps/card-creator/components/card-creator/Renderer/MeldRenderer.tsx";
import { NormalRenderer } from "@fabkit/apps/card-creator/components/card-creator/Renderer/NormalRenderer.tsx";
import type { MeldCardRenderConfig } from "@fabkit/apps/card-creator/config/rendering/types.ts";
import { AllRenderConfigVariations } from "@fabkit/apps/card-creator/config/rendering.ts";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";

export type RendererProps = {
	ref?: Ref<SVGSVGElement>;
	/** When true, suppresses editor-only UI (active-half overlay, etc.) for export. */
	isExport?: boolean;
};

export function Renderer({ ref, isExport = false }: RendererProps) {
	const { t } = useTranslation("card-creator");
	const CardBack = useCardCreator((state) => state.CardBack);
	const renderConfig =
		AllRenderConfigVariations[CardBack?.renderer || ""] || null;

	switch (renderConfig?.renderer) {
		case null:
			return null;
		case "normal":
			return <NormalRenderer ref={ref} config={renderConfig} />;
		case "meld":
			return (
				<MeldRenderer
					ref={ref}
					config={renderConfig as MeldCardRenderConfig}
					isExport={isExport}
				/>
			);
		default:
			return (
				<div className="border border-red-500 p-4">
					<span className="text-xl text-red-500">
						{t("components.renderer.unsupported")}
					</span>
				</div>
			);
	}
}
