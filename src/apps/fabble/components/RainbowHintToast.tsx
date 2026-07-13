import { useTranslation } from "react-i18next";

export interface RainbowHintToastProps {
	onDismiss: () => void;
}

export function RainbowHintToast({ onDismiss }: RainbowHintToastProps) {
	const { t } = useTranslation("fabble");

	return (
		<div className="mt-3 flex items-start gap-3 rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm text-heading">
			<span className="flex-1">🌈 {t("play.rainbow_hint.message")}</span>
			<button
				type="button"
				onClick={onDismiss}
				className="shrink-0 rounded-md border border-border-primary px-2 py-1 text-xs font-semibold text-body transition-colors hover:bg-surface-active"
			>
				{t("play.rainbow_hint.dismiss")}
			</button>
		</div>
	);
}
