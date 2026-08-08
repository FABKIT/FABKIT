import { useIsFieldVisible } from "@fabkit/apps/card-creator/components/utils.ts";
import { EditorCustomEmojiRows } from "@fabkit/apps/card-creator/config/editor.ts";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import RichTextEditor from "@fabkit/platform/components/form/RichTextEditor";
import type { HTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

export function CardTextField(props: HTMLAttributes<HTMLDivElement>) {
	const { t } = useTranslation("card-creator");
	const { CardTextNode, setCardText } = useCardCreator();
	const shouldShow = useIsFieldVisible("CardText");

	if (!shouldShow) return null;
	return (
		<div {...props}>
			<div className="block text-sm font-medium text-muted mb-2">
				{t("card_creator.text_label")}
			</div>
			<RichTextEditor
				content={CardTextNode}
				onChange={setCardText}
				customEmojis={EditorCustomEmojiRows}
			/>
		</div>
	);
}
