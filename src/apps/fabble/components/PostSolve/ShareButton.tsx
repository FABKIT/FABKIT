import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { useShareResult } from "../../hooks/useShareResult";
import type { FabbleMode, GuessEntry } from "../../lib/types";

interface ShareButtonProps {
	guesses: GuessEntry[];
	mode: FabbleMode;
	date: string;
	guessLimit: number;
	won: boolean;
}

export const ShareButton = forwardRef<HTMLButtonElement, ShareButtonProps>(
	function ShareButton({ guesses, mode, date, guessLimit, won }, ref) {
		const { t } = useTranslation("fabble");
		const { share, copied } = useShareResult();

		// Note: @zumer/snapdom is available as a runtime dep for future image-based
		// share. Current implementation uses emoji grid text only.
		function handleShare() {
			share({ guesses, mode, date, guessLimit, won });
		}

		return (
			<button
				ref={ref}
				type="button"
				onClick={handleShare}
				aria-label={t("aria.share_result")}
				className="min-h-[44px] px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
			>
				{copied ? t("share.copied") : t("result.share")}
			</button>
		);
	},
);


