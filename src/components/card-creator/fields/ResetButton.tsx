import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ResetButtonProps {
	onClick: () => void;
}

export function ResetButton({ onClick }: ResetButtonProps) {
	const { t } = useTranslation();

	return (
		<button
			type="button"
			className="inline-flex items-center justify-center gap-x-1.5 bg-primary text-sm font-semibold text-white rounded-md px-3.5 py-2.5 hover:opacity-90 transition-opacity"
			onClick={onClick}
		>
			{t("card_creator.reset_label")}
			<RotateCcw className="w-4 h-4" />
		</button>
	);
}
