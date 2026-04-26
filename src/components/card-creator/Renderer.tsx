import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import type { MeldCardRenderConfig } from "../../config/rendering/types.ts";
import { AllRenderConfigVariations } from "../../config/rendering.ts";
import { useCardCreator } from "../../stores/card-creator.ts";
import { MeldRenderer } from "./Renderer/MeldRenderer.tsx";
import { NormalRenderer } from "./Renderer/NormalRenderer.tsx";

export type RendererProps = {
	ref?: Ref<SVGSVGElement>;
	/** When true, suppresses editor-only UI (active-half overlay, etc.) for export. */
	isExport?: boolean;
};

export function Renderer({ ref, isExport = false }: RendererProps) {
	const { t } = useTranslation();
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
