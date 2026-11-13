import { ConfirmDialog } from "@fabkit/apps/pack-opener/components/ConfirmDialog";
import { CurrencyToggle } from "@fabkit/apps/pack-opener/components/CurrencyToggle";
import { SessionStatsDialog } from "@fabkit/apps/pack-opener/components/hud/SessionStatsDialog";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Currency, session stats and reset — on screen in EVERY phase, including
 * while a pack is being torn open and revealed: they are about the session
 * rather than about the pack in front of you. */
export function SessionControls() {
	const { t } = useTranslation("pack-opener");
	const openedPacks = usePackOpenerStore(
		(state) => state.openedPacksThisSession,
	);
	const resetSession = usePackOpenerStore((state) => state.resetSession);
	const [statsOpen, setStatsOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setStatsOpen(true)}
				className="min-w-0 flex-1 truncate rounded-full border border-primary bg-surface/80 px-4 py-2.5 text-sm font-semibold text-primary shadow-lg backdrop-blur transition-colors hover:bg-primary hover:text-white md:flex-none md:px-6 md:text-base"
			>
				{t("stats.open_button")}
			</button>
			<CurrencyToggle variant="bar" />
			{openedPacks.length > 0 && (
				<button
					type="button"
					onClick={() => setResetOpen(true)}
					aria-label={t("reset.open_button")}
					title={t("reset.open_button")}
					className="grid size-11 shrink-0 place-items-center rounded-full border border-primary bg-surface/80 text-primary shadow-lg backdrop-blur transition-colors hover:bg-primary hover:text-white"
				>
					<RotateCcw className="size-5" aria-hidden="true" />
				</button>
			)}

			<SessionStatsDialog
				open={statsOpen}
				onClose={() => setStatsOpen(false)}
				openedPacks={openedPacks}
			/>

			<ConfirmDialog
				open={resetOpen}
				title={t("reset.title")}
				body={t("reset.body", { count: openedPacks.length })}
				confirmLabel={t("reset.confirm")}
				cancelLabel={t("reset.cancel")}
				onCancel={() => setResetOpen(false)}
				onConfirm={() => {
					setResetOpen(false);
					resetSession();
				}}
			/>
		</>
	);
}
