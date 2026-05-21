import { forwardRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useShareResult } from "@fabkit/apps/fabble/hooks/useShareResult";
import type { FabbleMode, GuessEntry } from "@fabkit/apps/fabble/lib/types";

interface ShareButtonProps {
	guesses: GuessEntry[];
	mode: FabbleMode;
	date: string;
	guessLimit: number;
	won: boolean;
}

export const ShareButton = forwardRef<HTMLButtonElement, ShareButtonProps>(
	({ guesses, mode, date, guessLimit, won }, ref) => {
		const { t } = useTranslation("fabble");
		const { share, copied, copyError } = useShareResult();

		const handleShare = useCallback(() => {
			share({ guesses, mode, date, guessLimit, won });
		}, [share, guesses, mode, date, guessLimit, won]);

		return (
			<button
				ref={ref}
				type="button"
				onClick={handleShare}
				aria-label={t("aria.share_result")}
				className="min-h-11 px-6 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
			>
				{copyError ? t("share.copy_error") : copied ? t("share.copied") : t("result.share")}
			</button>
		);
	},
);
