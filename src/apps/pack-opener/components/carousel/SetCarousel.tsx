import { LeavePackDialog } from "@fabkit/apps/pack-opener/components/carousel/LeavePackDialog";
import { SetInfoDialog } from "@fabkit/apps/pack-opener/components/carousel/SetInfoDialog";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import Select from "@fabkit/platform/components/form/Select";
import { getSetIndex } from "@fabkit/shared/data/fab-printings";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Minimum horizontal drag, in pixels, before a touch gesture counts as a
 * swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 40;

/** Page-level chrome, not a HUD overlay (see PackOpenerHUD.tsx) — it needs
 * to be visible whenever there's a set to show, including mid-animation now
 * (see the execution plan, section 1.5: a player can switch sets while a
 * pack is tearing or revealing, behind LeavePackDialog's confirmation).
 *
 * Sits in normal document flow ABOVE the canvas rather than floating over
 * it. It used to be absolutely positioned across the top of the canvas,
 * which put the set logo and the pull-rates button directly on top of the
 * card underneath as soon as the card was anything but small. The canvas
 * takes the remaining height (see PackOpenerPage.tsx), so the two can no
 * longer overlap at any viewport size.
 * Reads set data straight from getSetIndex()'s module cache rather than a
 * loader prop: the route loader (src/routes/pack-opener.tsx) already awaits
 * loadSetIndex() before this page ever mounts, same convention
 * loadFabCardDataset()'s consumers use. */
export function SetCarousel() {
	const { t } = useTranslation("pack-opener");
	// Deliberately NOT subscribed to `phase`/`pack` here — this component no
	// longer needs to re-render when those change (it stays on screen through
	// every phase now); requestSetChange below reads them fresh via
	// getState() only at the moment a set change is actually requested.
	const selectedSet = usePackOpenerStore((state) => state.selectedSet);
	const selectSet = usePackOpenerStore((state) => state.selectSet);
	const initializeSetArt = usePackOpenerStore(
		(state) => state.initializeSetArt,
	);
	const [infoOpen, setInfoOpen] = useState(false);
	const [pendingSetCode, setPendingSetCode] = useState<string | null>(null);
	const touchStartX = useRef<number | null>(null);

	const sets = getSetIndex();
	const hasSets = sets.length > 0;

	// Picks a default set on a first-ever visit, or resolves pack art for a
	// set already restored from localStorage once the index exists to look
	// it up in — see initializeSetArt's own doc comment. Safe to call every
	// mount; it no-ops once there's nothing left to resolve.
	useEffect(() => {
		if (sets.length === 0) return;
		initializeSetArt();
	}, [sets, initializeSetArt]);

	const currentIndex = sets.findIndex((set) => set.code === selectedSet);

	/** The single gate every set-changing gesture (arrows, dropdown, swipe,
	 * arrow keys) goes through. A pack still being torn open or revealed is
	 * never silently discarded — this pauses on LeavePackDialog first, and
	 * only calls the store's selectSet() (which does the actual discarding)
	 * once the player has confirmed. Reads live store state via getState()
	 * rather than this render's own `phase`/`pack`, and closes only over
	 * stable setters (selectSet's identity never changes, same as any
	 * zustand action), so it's safe to depend on from the keydown effect
	 * below without that effect needing to re-run on every phase change. */
	const requestSetChange = useCallback(
		(code: string): void => {
			const state = usePackOpenerStore.getState();
			if (code === state.selectedSet) return;
			const hasInFlightPack =
				state.pack !== null &&
				(state.phase === "tearing" || state.phase === "revealing");
			if (hasInFlightPack) {
				setPendingSetCode(code);
				return;
			}
			selectSet(code);
		},
		[selectSet],
	);

	function goTo(offset: number): void {
		if (sets.length === 0) return;
		const base = currentIndex >= 0 ? currentIndex : sets.length - 1;
		const nextIndex = (base + offset + sets.length) % sets.length;
		requestSetChange(sets[nextIndex].code);
	}

	// Left/right arrow keys step through sets whenever the carousel is on
	// screen — there's no text input on this page to conflict with. Reads
	// live store/index state inside the handler instead of closing over
	// this render's values, so the listener never needs to be re-attached
	// (and never goes stale) as the selection changes.
	useEffect(() => {
		if (!hasSets) return;
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			const liveSets = getSetIndex();
			if (liveSets.length === 0) return;
			const liveSelected = usePackOpenerStore.getState().selectedSet;
			const base = Math.max(
				liveSets.findIndex((set) => set.code === liveSelected),
				0,
			);
			const offset = event.key === "ArrowLeft" ? -1 : 1;
			const nextIndex = (base + offset + liveSets.length) % liveSets.length;
			requestSetChange(liveSets[nextIndex].code);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [hasSets, requestSetChange]);

	if (!hasSets) return null;

	const current =
		currentIndex >= 0 ? sets[currentIndex] : sets[sets.length - 1];

	const dropdownOptions = sets.map((set) => ({
		value: set.code,
		label: set.name,
	}));

	return (
		<div
			className="pointer-events-auto flex w-full shrink-0 flex-col items-center gap-1.5 px-4 pt-2 pb-3"
			onTouchStart={(event) => {
				touchStartX.current = event.touches[0].clientX;
			}}
			onTouchEnd={(event) => {
				if (touchStartX.current === null) return;
				const delta = event.changedTouches[0].clientX - touchStartX.current;
				touchStartX.current = null;
				if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
				goTo(delta > 0 ? -1 : 1);
			}}
		>
			<div className="flex items-center gap-2 rounded-full bg-surface/85 px-3 py-2 shadow-lg backdrop-blur">
				<button
					type="button"
					onClick={() => goTo(-1)}
					aria-label={t("carousel.previous_set")}
					className="rounded-full p-1 text-muted transition-colors hover:text-heading"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>

				{current.setLogo ? (
					<img
						src={current.setLogo}
						alt={current.name}
						className="h-16 w-auto max-w-56 object-contain"
					/>
				) : (
					<div className="flex items-center gap-2 px-1">
						<Package className="h-10 w-10 text-muted" aria-hidden="true" />
						<span className="text-sm font-semibold text-heading">
							{current.name}
						</span>
					</div>
				)}

				{/* Reuses the shared Select dropdown (same component the card
				    creator's card back picker uses — see the execution plan,
				    section 1.3), collapsed down to just the chevron: the logo
				    above already shows the current selection, so the button's
				    own value text is visually hidden (valueClassName, see
				    Select.tsx) rather than removed, keeping it in the
				    accessible name/value chain that Select already wires up.
				    Selecting an option here jumps straight to that set
				    instead of stepping one at a time. */}
				<Select
					value={current.code}
					onChange={(code) => requestSetChange(code)}
					options={dropdownOptions}
					label={null}
					ariaLabel={t("carousel.choose_set_label")}
					className="relative"
					buttonClassName="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors hover:bg-surface-active focus:outline-none"
					valueClassName="sr-only"
					optionsClassName="mt-1 w-64 bg-surface border border-border rounded-md shadow-lg py-1 focus:outline-none z-50 max-h-72 overflow-auto"
				/>

				<button
					type="button"
					onClick={() => goTo(1)}
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

			<SetInfoDialog
				open={infoOpen}
				onClose={() => setInfoOpen(false)}
				setCode={current.code}
				setName={current.name}
			/>

			<LeavePackDialog
				open={pendingSetCode !== null}
				onConfirm={() => {
					if (pendingSetCode) selectSet(pendingSetCode);
					setPendingSetCode(null);
				}}
				onCancel={() => setPendingSetCode(null)}
			/>
		</div>
	);
}
