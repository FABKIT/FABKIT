import { useTranslation } from "react-i18next";
import { useCountdown } from "../../hooks/useCountdown";

interface CountdownProps {
	onExpired?: () => void;
}

export function Countdown({ onExpired }: CountdownProps) {
	const { t } = useTranslation("fabble");
	const { timeString, isExpired } = useCountdown();

	if (isExpired) {
		return (
			<div aria-live="polite" className="flex flex-col items-center gap-2">
				<p className="text-sm font-semibold text-heading">
					{t("result.new_puzzle_available")}
				</p>
				<button
					type="button"
					onClick={onExpired}
					className="min-h-[44px] px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
				>
					{t("result.reload")}
				</button>
			</div>
		);
	}

	return (
		<p className="text-sm text-muted" aria-live="off" aria-atomic="false">
			{t("result.next_puzzle_in", { time: timeString })}
		</p>
	);
}


