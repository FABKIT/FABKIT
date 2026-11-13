import { ConfirmDialog } from "@fabkit/apps/pack-opener/components/ConfirmDialog";
import { SetInfoDialog } from "@fabkit/apps/pack-opener/components/carousel/SetInfoDialog";
import { SetLogo } from "@fabkit/apps/pack-opener/components/carousel/SetLogo";
import { buildSetDropdownOptions } from "@fabkit/apps/pack-opener/components/carousel/set-dropdown-options";
import { useNeighbourLogoPreload } from "@fabkit/apps/pack-opener/hooks/useNeighbourLogoPreload";
import { useSetNavigation } from "@fabkit/apps/pack-opener/hooks/useSetNavigation";
import { selectedSetPosition } from "@fabkit/apps/pack-opener/lib/set-index";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import Select from "@fabkit/platform/components/form/Select";
import { getSetIndex } from "@fabkit/shared/data/fab-printings";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/** In-flow chrome above the canvas, so it can't overlap the card. The dialogs sit
 * outside the swipe area because React bubbles their portalled touch events here. */
export function SetCarousel() {
	const { t } = useTranslation("pack-opener");
	const selectedSet = usePackOpenerStore((state) => state.selectedSet);
	const initializeSetArt = usePackOpenerStore(
		(state) => state.initializeSetArt,
	);
	const [infoOpen, setInfoOpen] = useState(false);

	const sets = getSetIndex();
	const navigation = useSetNavigation();
	const currentPosition = selectedSetPosition(sets, selectedSet);

	// Picks a default set when there is no usable selection, warms whichever
	// set is selected and re-rolls its pack front, on arriving at the page.
	useEffect(() => {
		if (sets.length === 0) return;
		initializeSetArt();
	}, [sets, initializeSetArt]);

	useNeighbourLogoPreload(sets, currentPosition);

	if (sets.length === 0) return null;

	const current = sets[currentPosition];

	return (
		<>
			<div
				className="pointer-events-auto flex w-full shrink-0 flex-col items-center gap-1.5 px-4 pt-2 pb-3"
				{...navigation.swipeHandlers}
			>
				<div className="relative flex items-center gap-2 rounded-full bg-surface/85 px-3 py-2 shadow-lg backdrop-blur">
					<button
						type="button"
						onClick={() => navigation.step(-1)}
						aria-label={t("carousel.previous_set")}
						className="rounded-full p-1 text-muted transition-colors hover:text-heading"
					>
						<ChevronLeft className="h-5 w-5" />
					</button>

					<SetLogo logoUrl={current.setLogo} name={current.name} />

					{/* The logo already shows the current set, so the value text is visually hidden. */}
					<Select
						value={current.code}
						onChange={(code) => navigation.requestSetChange(code)}
						options={buildSetDropdownOptions(sets, t)}
						label={null}
						ariaLabel={t("carousel.choose_set_label")}
						className="relative"
						buttonClassName="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors hover:bg-surface-active focus:outline-none"
						valueClassName="sr-only"
						optionsClassName="mt-1 w-64 bg-surface border border-border rounded-md shadow-lg py-1 focus:outline-none z-50 max-h-72 overflow-auto"
					/>

					<button
						type="button"
						onClick={() => navigation.step(1)}
						aria-label={t("carousel.next_set")}
						className="rounded-full p-1 text-muted transition-colors hover:text-heading"
					>
						<ChevronRight className="h-5 w-5" />
					</button>
				</div>

				{/* Fills with the brand colour and flips the label to white on hover. */}
				<button
					type="button"
					onClick={() => setInfoOpen(true)}
					className="rounded-md border border-primary bg-surface/70 px-3.5 py-2 text-sm font-semibold text-primary backdrop-blur transition-colors hover:bg-primary hover:text-white"
				>
					{t("carousel.set_info_button")}
				</button>
			</div>

			<SetInfoDialog
				open={infoOpen}
				onClose={() => setInfoOpen(false)}
				setCode={current.code}
				setName={current.name}
			/>

			<ConfirmDialog
				open={navigation.leaveDialogOpen}
				title={t("carousel.leave_pack_title")}
				body={t("carousel.leave_pack_body")}
				confirmLabel={t("carousel.leave_pack_confirm")}
				cancelLabel={t("carousel.leave_pack_cancel")}
				onConfirm={navigation.confirmLeave}
				onCancel={navigation.cancelLeave}
			/>
		</>
	);
}
