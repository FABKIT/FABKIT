import { useTranslation } from "react-i18next";

/** The "tap to open" prompt. Sits in the same fixed-height slot beneath the
 * canvas that the card's details use during a reveal (see
 * PackOpenerPage.tsx) rather than floating over the canvas — that keeps the
 * pack's own canvas the same height in the idle and tearing phases, so the
 * pack doesn't change size the instant it's tapped. */
export function IdleOverlay() {
	const { t } = useTranslation("pack-opener");

	return (
		<p className="animate-pulse text-lg font-medium text-heading drop-shadow">
			{t("page.tap_to_tear")}
		</p>
	);
}
