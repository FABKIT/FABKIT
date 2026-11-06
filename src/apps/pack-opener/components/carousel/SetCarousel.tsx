import { LeavePackDialog } from "@fabkit/apps/pack-opener/components/carousel/LeavePackDialog";
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

/** Page-level chrome, not an overlay floating over the canvas — it needs
 * to be visible whenever there's a set to show, including mid-animation: a
 * player can switch sets while a pack is tearing or revealing, behind
 * LeavePackDialog's confirmation.
 *
 * Sits in normal document flow ABOVE the canvas rather than floating over
 * it. It used to be absolutely positioned across the top of the canvas,
 * which put the set logo and the pull-rates button directly on top of the
 * card underneath as soon as the card was anything but small. The canvas
 * takes the remaining height (see PackOpenerPage.tsx), so the two can no
 * longer overlap at any viewport size.
 *
 * Reads set data straight from getSetIndex()'s module cache rather than a
 * loader prop: the route loader (src/routes/pack-opener.tsx) already awaits
 * loadSetIndex() before this page ever mounts.
 *
 * The dialogs render outside the swipe area deliberately. They portal away in
 * the DOM, but React still bubbles their touch events through the component
 * tree, so a sideways drag while reading one of them used to switch sets. */
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

					{/* Reuses the shared Select dropdown (same component the card
					    creator's card back picker uses), collapsed down to just the
					    chevron: the logo above already shows the current selection,
					    so the button's own value text is visually hidden
					    (valueClassName, see Select.tsx) rather than removed, keeping
					    it in the accessible name/value chain that Select already
					    wires up. Selecting an option here jumps straight to that set
					    instead of stepping one at a time. */}
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

				{/* Fills with the brand colour and flips the label to white on
				    hover. It previously only shifted its background, which left
				    the primary-coloured text washing into the hovered surface
				    behind it. */}
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

			<LeavePackDialog
				open={navigation.leaveDialogOpen}
				onConfirm={navigation.confirmLeave}
				onCancel={navigation.cancelLeave}
			/>
		</>
	);
}
