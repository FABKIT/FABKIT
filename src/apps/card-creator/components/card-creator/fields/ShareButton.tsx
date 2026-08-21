import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShareButtonProps {
	onClick: () => void;
}

export function ShareButton({ onClick }: ShareButtonProps) {
	const { t } = useTranslation("card-creator");

	return (
		<button
			type="button"
			className="inline-flex items-center justify-center gap-x-1.5 bg-primary text-sm font-semibold text-white rounded-md px-3.5 py-2.5 hover:opacity-90 transition-opacity"
			onClick={onClick}
		>
			{t("card_creator.share_label")}
			<Share2 className="w-4 h-4" />
		</button>
	);
}
