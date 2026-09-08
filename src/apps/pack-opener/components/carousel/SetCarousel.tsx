import { SetInfoDialog } from "@fabkit/apps/pack-opener/components/carousel/SetInfoDialog";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { getSetIndex } from "@fabkit/shared/data/fab-printings";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Minimum horizontal drag, in pixels, before a touch gesture counts as a
 * swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 40;

/** Page-level chrome, not a HUD overlay (see PackOpenerHUD.tsx) — it needs
 * to be visible whenever a set choice is meaningful (idle, done) and
 * hidden mid-animation, which doesn't line up with the HUD's own
 * per-phase children. Reads set data straight from getSetIndex()'s module
 * cache rather than a loader prop: the route loader
 * (src/routes/pack-opener.tsx) already awaits loadSetIndex() before this
 * page ever mounts, same convention loadFabCardDataset()'s consumers use. */
export function SetCarousel() {
	const { t } = useTranslation("pack-opener");
	const phase = usePackOpenerStore((state) => state.phase);
	const selectedSet = usePackOpenerStore((state) => state.selectedSet);
	const selectSet = usePackOpenerStore((state) => state.selectSet);
	const initializeSetArt = usePackOpenerStore(
		(state) => state.initializeSetArt,
	);
	const [infoOpen, setInfoOpen] = useState(false);
	const touchStartX = useRef<number | null>(null);

	const sets = getSetIndex();
	const visible =
		phase !== "tearing" && phase !== "revealing" && sets.length > 0;

	// Picks a default set on a first-ever visit, or resolves pack art for a
	// set already restored from localStorage once the index exists to look
	// it up in — see initializeSetArt's own doc comment. Safe to call every
	// mount; it no-ops once there's nothing left to resolve.
	useEffect(() => {
		if (sets.length === 0) return;
		initializeSetArt();
	}, [sets, initializeSetArt]);

	const currentIndex = sets.findIndex((set) => set.code === selectedSet);

	function goTo(offset: number): void {
		if (sets.length === 0) return;
		const base = currentIndex >= 0 ? currentIndex : sets.length - 1;
		const nextIndex = (base + offset + sets.length) % sets.length;
		selectSet(sets[nextIndex].code);
	}

	// Left/right arrow keys step through sets whenever the carousel is on
	// screen — there's no text input on this page to conflict with. Reads
	// live store/index state inside the handler instead of closing over
	// this render's values, so the listener never needs to be re-attached
	// (and never goes stale) as the selection changes.
	useEffect(() => {
		if (!visible) return;
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
			usePackOpenerStore.getState().selectSet(liveSets[nextIndex].code);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [visible]);

	if (!visible) return null;

	const current =
		currentIndex >= 0 ? sets[currentIndex] : sets[sets.length - 1];

	const releaseYear = current.releaseDate
		? new Date(current.releaseDate).getFullYear()
		: null;

	return (
		<div
			className="pointer-events-auto absolute inset-x-0 top-0 flex flex-col items-center gap-1 p-4"
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
			<div className="flex items-center gap-3 rounded-full bg-surface/85 px-3 py-2 shadow-lg backdrop-blur">
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
						alt=""
						className="h-8 w-auto max-w-28 object-contain"
					/>
				) : (
					<Package className="h-6 w-6 text-muted" aria-hidden="true" />
				)}

				<button
					type="button"
					onClick={() => goTo(1)}
					aria-label={t("carousel.next_set")}
					className="rounded-full p-1 text-muted transition-colors hover:text-heading"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>

			<div className="text-center leading-tight">
				<p className="text-sm font-semibold text-heading">{current.name}</p>
				{releaseYear !== null && (
					<p className="text-xs text-subtle">{releaseYear}</p>
				)}
			</div>

			<button
				type="button"
				onClick={() => setInfoOpen(true)}
				className="text-xs text-muted underline-offset-2 transition-colors hover:text-heading hover:underline"
			>
				{t("carousel.set_info_button")}
			</button>

			<SetInfoDialog
				open={infoOpen}
				onClose={() => setInfoOpen(false)}
				setCode={current.code}
				setName={current.name}
			/>
		</div>
	);
}
