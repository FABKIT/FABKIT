import { ConfirmDialog } from "@fabkit/apps/pack-opener/components/ConfirmDialog";
import { useTranslation } from "react-i18next";

interface ResetSessionDialogProps {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	/** Shown in the body so the player can see what they are about to lose
	 * without closing this and going to look. */
	packsOpened: number;
}

/** Confirms wiping the session before stores/pack-opener.ts's resetSession()
 * runs. The session ledger is the only record a run has, nothing about it is
 * persisted, and there is no undo, so it is not something a mis-tap on a
 * crowded button bar should be able to do. */
export function ResetSessionDialog({
	open,
	onConfirm,
	onCancel,
	packsOpened,
}: ResetSessionDialogProps) {
	const { t } = useTranslation("pack-opener");

	return (
		<ConfirmDialog
			open={open}
			title={t("reset.title")}
			body={t("reset.body", { count: packsOpened })}
			confirmLabel={t("reset.confirm")}
			cancelLabel={t("reset.cancel")}
			onConfirm={onConfirm}
			onCancel={onCancel}
		/>
	);
}
