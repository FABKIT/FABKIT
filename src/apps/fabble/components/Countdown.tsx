import { useCountdown } from "@fabkit/apps/fabble/hooks/useCountdown";
import { useTranslation } from "react-i18next";

export interface CountdownProps {
	onNewDay: () => void;
}

export function Countdown({ onNewDay }: CountdownProps) {
	const { t } = useTranslation("fabble");
	const { label, elapsed } = useCountdown();

	if (elapsed) {
		return (
			<button
				type="button"
				onClick={onNewDay}
				className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
			>
				{t("end.new_puzzle")}
			</button>
		);
	}

	return (
		<span className="text-sm text-muted">
			{t("end.next_puzzle", { time: label })}
		</span>
	);
}
