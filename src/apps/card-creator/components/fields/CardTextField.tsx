import type { HTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { useCardCreator } from "@apps/card-creator/stores/card-creator";
import RichTextEditor from "../../../../components/form/RichTextEditor.tsx";
import { useIsFieldVisible } from "../utils";

export function CardTextField(props: HTMLAttributes<HTMLDivElement>) {
	const { t } = useTranslation();
	const { CardTextNode, setCardText } = useCardCreator();
	const shouldShow = useIsFieldVisible("CardText");

	if (!shouldShow) return null;
	return (
		<div {...props}>
			<div className="block text-sm font-medium text-muted mb-2">
				{t("card_creator.text_label")}
			</div>
			<RichTextEditor content={CardTextNode} onChange={setCardText} />
		</div>
	);
}
