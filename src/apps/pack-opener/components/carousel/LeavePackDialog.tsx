import { ConfirmDialog } from "@fabkit/apps/pack-opener/components/ConfirmDialog";
import { useTranslation } from "react-i18next";

interface LeavePackDialogProps {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/** Confirms discarding an in-flight pack before switching sets. The carousel
 * stays visible while a pack is tearing or revealing, letting a player switch
 * sets mid-pack, but an abandoned pack must never silently vanish from what
 * the player thinks they pulled. This dialog is the gate between "the carousel
 * let them tap another set" and stores/pack-opener.ts's selectSet(), which is
 * itself unconditional and simply discards the current pack once called.
 * Nothing here is recorded into session stats, on purpose: stats should only
 * ever reflect cards a player actually saw. */
export function LeavePackDialog({
	open,
	onConfirm,
	onCancel,
}: LeavePackDialogProps) {
	const { t } = useTranslation("pack-opener");

	return (
		<ConfirmDialog
			open={open}
			title={t("carousel.leave_pack_title")}
			body={t("carousel.leave_pack_body")}
			confirmLabel={t("carousel.leave_pack_confirm")}
			cancelLabel={t("carousel.leave_pack_cancel")}
			onConfirm={onConfirm}
			onCancel={onCancel}
		/>
	);
}
