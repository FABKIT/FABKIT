import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import { AllRenderConfigVariations } from "../../config/rendering.ts";
import { useCardCreator } from "../../stores/card-creator.ts";
import { NormalRenderer } from "./Renderer/NormalRenderer.tsx";

export type RendererProps = {
	ref?: Ref<SVGSVGElement>;
};

export function Renderer({ ref }: RendererProps) {
	const { t } = useTranslation();
	const CardBack = useCardCreator((state) => state.CardBack);
	const renderConfig =
		AllRenderConfigVariations[CardBack?.renderer || ""] || null;

	switch (renderConfig?.renderer) {
		case null:
			return null;
		case "normal":
			return <NormalRenderer ref={ref} config={renderConfig} />;
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
