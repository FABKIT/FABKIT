import type * as React from "react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useCardCreator } from "../../../stores/card-creator";

type DragZone = { x: number; y: number; width: number; height: number };

interface CardArtworkPositionContainerProps {
	children: ReactNode;
	/** SVG-coordinate rect defining where drag initiates artwork movement. Touches outside fall through to native scroll behaviour. */
	artworkDragZone?: DragZone;
	/** SVG viewBox dimensions used to convert DOM coordinates into SVG space. */
	viewBox?: { width: number; height: number };
	/**
	 * Meld mode: two independent artwork drag zones.
	 * When both are provided the container operates in meld mode and ignores
	 * artworkDragZone / the normal CardArtPosition store slice.
	 */
	meldLeftDragZone?: DragZone;
	meldRightDragZone?: DragZone;
}

const DRAG_THRESHOLD = 8; // px movement before updating artwork position

/**
 * How close (screen px) a press must be to the hybrid seam to grab it rather
 * than the artwork. Deliberately tight — the seam is grabbable along its whole
 * length, including over the artwork, so it must not steal ordinary art drags.
 * Touch gets a wider tolerance because fingers are less precise than cursors.
 */
const SEAM_GRAB_TOLERANCE = 8;
const SEAM_GRAB_TOLERANCE_TOUCH = 14;

const getTouchDistance = (touches: React.TouchList) => {
	if (touches.length < 2) return null;
	const dx = touches[0].clientX - touches[1].clientX;
	const dy = touches[0].clientY - touches[1].clientY;
	return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Container component that captures drag and scroll events.
 *
 * Touch handling is split across two mechanisms:
 * - React synthetic events handle touchstart/touchend (no preventDefault needed)
 * - A native non-passive touchmove listener handles scroll prevention and position updates.
 *   React registers touch listeners as passive, making e.preventDefault() a no-op there.
 *
 * Meld mode:
 *   When meldLeftDragZone and meldRightDragZone are both provided, the container
 *   tracks which half is being dragged and calls setMeldHalfArtPosition accordingly.
 */
export function CardArtworkPositionContainer({
	children,
	artworkDragZone,
	viewBox,
	meldLeftDragZone,
	meldRightDragZone,
}: CardArtworkPositionContainerProps) {
	const isMeldMode = !!(meldLeftDragZone && meldRightDragZone);

	// Normal mode store reads
	const CardArtPosition = useCardCreator((state) => state.CardArtPosition);
	const setCardArtPosition = useCardCreator(
		(state) => state.setCardArtPosition,
	);

	// Meld mode store reads
	const meldHalfA = useCardCreator((state) => state.meldHalfA);
	const meldHalfB = useCardCreator((state) => state.meldHalfB);
	const setMeldHalfArtPosition = useCardCreator(
		(state) => state.setMeldHalfArtPosition,
	);

	// Hybrid seam store reads
	const CardBackRight = useCardCreator((state) => state.CardBackRight);
	const CardBackSplit = useCardCreator((state) => state.CardBackSplit);
	const setCardBackSplit = useCardCreator((state) => state.setCardBackSplit);

	/** Meld has no hybrid seam. */
	const hasSeam = !isMeldMode && CardBackRight !== null;
	const [isSeamHovered, setIsSeamHovered] = useState(false);
	const isDraggingSeam = useRef(false);
	// Artwork dragging hides the guide entirely so it can't distract from, or be
	// confused with, the art being positioned. State rather than a ref because
	// the guide's visibility has to re-render.
	const [isDraggingArtwork, setIsDraggingArtwork] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);

	// isArtworkTouch: touch started inside the artwork zone — scroll must be suppressed.
	// isDragging: touch has moved past threshold — artwork position should update.
	const isArtworkTouch = useRef(false);
	const isDragging = useRef(false);
	// For meld mode: which half is being dragged ("A" | "B" | null)
	const meldDragHalf = useRef<"A" | "B" | null>(null);
	const dragStart = useRef({ x: 0, y: 0 });
	const touchStartPos = useRef({ x: 0, y: 0 });
	const lastTouchDistance = useRef<number | null>(null);

	const clientToSvg = useCallback(
		(clientX: number, clientY: number): { x: number; y: number } => {
			if (!viewBox || !containerRef.current) return { x: clientX, y: clientY };
			const rect = containerRef.current.getBoundingClientRect();
			return {
				x: (clientX - rect.left) / (rect.width / viewBox.width),
				y: (clientY - rect.top) / (rect.height / viewBox.height),
			};
		},
		[viewBox],
	);

	/**
	 * Returns true when (clientX, clientY) falls inside the given zone.
	 * Converts DOM viewport coordinates to SVG viewBox coordinates.
	 * Falls back to true (allow drag anywhere) when zone or viewBox is absent.
	 */
	const isInZone = useCallback(
		(clientX: number, clientY: number, zone: DragZone): boolean => {
			if (!viewBox || !containerRef.current) return true;
			const rect = containerRef.current.getBoundingClientRect();
			const scaleX = rect.width / viewBox.width;
			const scaleY = rect.height / viewBox.height;
			const svgX = (clientX - rect.left) / scaleX;
			const svgY = (clientY - rect.top) / scaleY;
			return (
				svgX >= zone.x &&
				svgX <= zone.x + zone.width &&
				svgY >= zone.y &&
				svgY <= zone.y + zone.height
			);
		},
		[viewBox],
	);

	const isInArtworkZone = useCallback(
		(clientX: number, clientY: number): boolean => {
			if (!artworkDragZone || !viewBox || !containerRef.current) return true;
			return isInZone(clientX, clientY, artworkDragZone);
		},
		[artworkDragZone, viewBox, isInZone],
	);

	/**
	 * True when a press should move the hybrid seam rather than the artwork.
	 * The seam is grabbable along its full length — including across the artwork —
	 * but only within a tight tolerance of the line itself, so ordinary artwork
	 * drags anywhere else are unaffected.
	 */
	const isSeamGrab = useCallback(
		(clientX: number, isTouch = false): boolean => {
			if (!hasSeam) return false;
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect || rect.width === 0) return false;
			const seamX = rect.left + rect.width * CardBackSplit;
			const tolerance = isTouch
				? SEAM_GRAB_TOLERANCE_TOUCH
				: SEAM_GRAB_TOLERANCE;
			return Math.abs(clientX - seamX) <= tolerance;
		},
		[hasSeam, CardBackSplit],
	);

	/** Moves the seam to the pointer. The store clamps and snaps to centre. */
	const applySeamDrag = useCallback(
		(clientX: number) => {
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect || rect.width === 0) return;
			setCardBackSplit((clientX - rect.left) / rect.width);
		},
		[setCardBackSplit],
	);

	/**
	 * In meld mode: detect which half's zone was touched.
	 * Returns "A", "B", or null if neither zone was hit.
	 */
	const getMeldDragHalf = useCallback(
		(clientX: number, clientY: number): "A" | "B" | null => {
			if (!meldLeftDragZone || !meldRightDragZone) return null;
			if (isInZone(clientX, clientY, meldLeftDragZone)) return "A";
			if (isInZone(clientX, clientY, meldRightDragZone)) return "B";
			return null;
		},
		[meldLeftDragZone, meldRightDragZone, isInZone],
	);

	const applyMeldDrag = useCallback(
		(half: "A" | "B", clientX: number, clientY: number) => {
			const pos =
				half === "A" ? meldHalfA.CardArtPosition : meldHalfB.CardArtPosition;
			if (!pos) return;
			const svg = clientToSvg(clientX, clientY);
			setMeldHalfArtPosition(half, {
				x: svg.x - dragStart.current.x,
				y: svg.y - dragStart.current.y,
				width: pos.width,
				height: pos.height,
			});
		},
		[
			meldHalfA.CardArtPosition,
			meldHalfB.CardArtPosition,
			setMeldHalfArtPosition,
			clientToSvg,
		],
	);

	// Keep a stable ref to the latest touchmove logic so the native listener
	// (registered once in useEffect) always sees fresh store values.
	const touchMoveHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);
	touchMoveHandlerRef.current = (e: TouchEvent) => {
		if (e.touches.length === 1) {
			if (isDraggingSeam.current) {
				e.preventDefault();
				applySeamDrag(e.touches[0].clientX);
				return;
			}
			if (!isArtworkTouch.current) return;

			// Touch started in artwork zone — always prevent scroll for this gesture.
			e.preventDefault();

			if (!isDragging.current) {
				const dx = e.touches[0].clientX - touchStartPos.current.x;
				const dy = e.touches[0].clientY - touchStartPos.current.y;
				if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
				isDragging.current = true;
				setIsDraggingArtwork(true);
			}

			if (isMeldMode) {
				if (!meldDragHalf.current) return;
				applyMeldDrag(
					meldDragHalf.current,
					e.touches[0].clientX,
					e.touches[0].clientY,
				);
			} else {
				if (!CardArtPosition) return;
				const svg = clientToSvg(e.touches[0].clientX, e.touches[0].clientY);
				setCardArtPosition({
					x: svg.x - dragStart.current.x,
					y: svg.y - dragStart.current.y,
					width: CardArtPosition.width,
					height: CardArtPosition.height,
				});
			}
		} else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
			e.preventDefault();
			const currentDistance = getTouchDistance(
				e.touches as unknown as React.TouchList,
			);
			if (currentDistance === null) return;
			const scaleFactor = currentDistance / lastTouchDistance.current;

			if (isMeldMode && meldDragHalf.current) {
				const half = meldDragHalf.current;
				const pos =
					half === "A" ? meldHalfA.CardArtPosition : meldHalfB.CardArtPosition;
				if (!pos) return;
				const newWidth = pos.width * scaleFactor;
				const newHeight = pos.height * scaleFactor;
				if (
					newWidth < 50 ||
					newWidth > 5000 ||
					newHeight < 50 ||
					newHeight > 5000
				)
					return;
				setMeldHalfArtPosition(half, {
					x: pos.x,
					y: pos.y,
					width: newWidth,
					height: newHeight,
				});
			} else if (!isMeldMode) {
				if (!CardArtPosition) return;
				const newWidth = CardArtPosition.width * scaleFactor;
				const newHeight = CardArtPosition.height * scaleFactor;
				if (
					newWidth < 50 ||
					newWidth > 5000 ||
					newHeight < 50 ||
					newHeight > 5000
				)
					return;
				setCardArtPosition({
					x: CardArtPosition.x,
					y: CardArtPosition.y,
					width: newWidth,
					height: newHeight,
				});
			}

			lastTouchDistance.current = currentDistance;
		}
	};

	// Register non-passive native listeners once.
	// React registers touch/wheel listeners as passive, making e.preventDefault() a no-op there.
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const touchHandler = (e: TouchEvent) => touchMoveHandlerRef.current?.(e);
		const wheelHandler = (e: WheelEvent) => wheelHandlerRef.current?.(e);
		el.addEventListener("touchmove", touchHandler, { passive: false });
		el.addEventListener("wheel", wheelHandler, { passive: false });
		return () => {
			el.removeEventListener("touchmove", touchHandler);
			el.removeEventListener("wheel", wheelHandler);
		};
	}, []);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// A press right on the seam grabs it; everything else falls through to
			// the artwork, which keeps its whole zone.
			if (isSeamGrab(e.clientX)) {
				isDraggingSeam.current = true;
				applySeamDrag(e.clientX);
				return;
			}
			setIsDraggingArtwork(true);
			if (isMeldMode) {
				const half = getMeldDragHalf(e.clientX, e.clientY);
				if (!half) return;
				meldDragHalf.current = half;
				isDragging.current = true;
				const pos =
					half === "A" ? meldHalfA.CardArtPosition : meldHalfB.CardArtPosition;
				const svg = clientToSvg(e.clientX, e.clientY);
				dragStart.current = {
					x: svg.x - (pos?.x ?? 0),
					y: svg.y - (pos?.y ?? 0),
				};
			} else {
				if (!isInArtworkZone(e.clientX, e.clientY)) return;
				const svg = clientToSvg(e.clientX, e.clientY);
				dragStart.current = {
					x: svg.x - (CardArtPosition?.x ?? 0),
					y: svg.y - (CardArtPosition?.y ?? 0),
				};
				isDragging.current = true;
			}
		},
		[
			isMeldMode,
			getMeldDragHalf,
			meldHalfA.CardArtPosition,
			meldHalfB.CardArtPosition,
			isInArtworkZone,
			CardArtPosition?.x,
			CardArtPosition?.y,
			clientToSvg,
			isSeamGrab,
			applySeamDrag,
		],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isDraggingSeam.current) {
				applySeamDrag(e.clientX);
				return;
			}
			// Cursor hint for the seam. Written straight to the node rather than
			// held in state — this fires on every mouse move, and a re-render per
			// pixel would be wasteful.
			if (containerRef.current && !isDragging.current) {
				containerRef.current.style.cursor = isSeamGrab(e.clientX)
					? "ew-resize"
					: "";
			}
			if (!isDragging.current) return;
			if (isMeldMode) {
				if (!meldDragHalf.current) return;
				applyMeldDrag(meldDragHalf.current, e.clientX, e.clientY);
			} else {
				if (!CardArtPosition) return;
				const svg = clientToSvg(e.clientX, e.clientY);
				setCardArtPosition({
					x: svg.x - dragStart.current.x,
					y: svg.y - dragStart.current.y,
					width: CardArtPosition.width,
					height: CardArtPosition.height,
				});
			}
		},
		[
			isMeldMode,
			applyMeldDrag,
			CardArtPosition,
			setCardArtPosition,
			clientToSvg,
			applySeamDrag,
			isSeamGrab,
		],
	);

	const handleMouseUp = useCallback(() => {
		isDragging.current = false;
		isDraggingSeam.current = false;
		meldDragHalf.current = null;
		setIsDraggingArtwork(false);
	}, []);

	const handleMouseLeave = useCallback(() => {
		isDragging.current = false;
		isDraggingSeam.current = false;
		meldDragHalf.current = null;
		setIsSeamHovered(false);
		setIsDraggingArtwork(false);
	}, []);

	// Keep a stable ref to the latest wheel logic so the native non-passive
	// listener (registered once in useEffect) always sees fresh store values.
	const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);
	wheelHandlerRef.current = (e: WheelEvent) => {
		const scaleFactor = 1 + -e.deltaY * 0.001;

		if (isMeldMode) {
			const half = getMeldDragHalf(e.clientX, e.clientY);
			if (!half) return; // outside artwork zone — let page scroll
			e.preventDefault();
			const pos =
				half === "A" ? meldHalfA.CardArtPosition : meldHalfB.CardArtPosition;
			if (!pos) return;
			const newWidth = pos.width * scaleFactor;
			const newHeight = pos.height * scaleFactor;
			if (
				newWidth < 50 ||
				newWidth > 5000 ||
				newHeight < 50 ||
				newHeight > 5000
			)
				return;
			setMeldHalfArtPosition(half, {
				x: pos.x,
				y: pos.y,
				width: newWidth,
				height: newHeight,
			});
		} else {
			if (!isInArtworkZone(e.clientX, e.clientY)) return; // outside artwork zone — let page scroll
			e.preventDefault();
			if (!CardArtPosition) return;
			const newWidth = CardArtPosition.width * scaleFactor;
			const newHeight = CardArtPosition.height * scaleFactor;
			if (
				newWidth < 50 ||
				newWidth > 5000 ||
				newHeight < 50 ||
				newHeight > 5000
			)
				return;
			setCardArtPosition({
				x: CardArtPosition.x,
				y: CardArtPosition.y,
				width: newWidth,
				height: newHeight,
			});
		}
	};

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 1) {
				// Tapping right on the seam grabs it. Revealing the guide on the same
				// gesture means a single tap-and-drag works without a priming tap.
				if (isSeamGrab(e.touches[0].clientX, true)) {
					isDraggingSeam.current = true;
					setIsSeamHovered(true);
					applySeamDrag(e.touches[0].clientX);
					return;
				}
				if (isMeldMode) {
					const half = getMeldDragHalf(
						e.touches[0].clientX,
						e.touches[0].clientY,
					);
					if (!half) return;
					meldDragHalf.current = half;
					isArtworkTouch.current = true;
					isDragging.current = false;
					touchStartPos.current = {
						x: e.touches[0].clientX,
						y: e.touches[0].clientY,
					};
					const pos =
						half === "A"
							? meldHalfA.CardArtPosition
							: meldHalfB.CardArtPosition;
					const svg = clientToSvg(e.touches[0].clientX, e.touches[0].clientY);
					dragStart.current = {
						x: svg.x - (pos?.x ?? 0),
						y: svg.y - (pos?.y ?? 0),
					};
				} else {
					if (!isInArtworkZone(e.touches[0].clientX, e.touches[0].clientY))
						return;
					isArtworkTouch.current = true;
					isDragging.current = false;
					touchStartPos.current = {
						x: e.touches[0].clientX,
						y: e.touches[0].clientY,
					};
					const svg = clientToSvg(e.touches[0].clientX, e.touches[0].clientY);
					dragStart.current = {
						x: svg.x - (CardArtPosition?.x ?? 0),
						y: svg.y - (CardArtPosition?.y ?? 0),
					};
				}
			} else if (e.touches.length === 2) {
				isArtworkTouch.current = false;
				isDragging.current = false;
				lastTouchDistance.current = getTouchDistance(e.touches);
				// For pinch-zoom in meld mode, remember which half to scale
				if (isMeldMode) {
					meldDragHalf.current = getMeldDragHalf(
						(e.touches[0].clientX + e.touches[1].clientX) / 2,
						(e.touches[0].clientY + e.touches[1].clientY) / 2,
					);
				}
			}
		},
		[
			isMeldMode,
			getMeldDragHalf,
			meldHalfA.CardArtPosition,
			meldHalfB.CardArtPosition,
			isInArtworkZone,
			CardArtPosition?.x,
			CardArtPosition?.y,
			clientToSvg,
			isSeamGrab,
			applySeamDrag,
		],
	);

	const handleTouchEnd = useCallback(() => {
		isArtworkTouch.current = false;
		isDragging.current = false;
		isDraggingSeam.current = false;
		lastTouchDistance.current = null;
		meldDragHalf.current = null;
		setIsSeamHovered(false);
		setIsDraggingArtwork(false);
	}, []);

	return (
		<div
			ref={containerRef}
			role="application"
			// select-none: without it, dragging on the preview drags a text
			// selection across the rest of the page.
			className={hasSeam ? "relative select-none" : "select-none"}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
			onMouseEnter={hasSeam ? () => setIsSeamHovered(true) : undefined}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
		>
			{children}

			{/*
			 * Seam guide. Lives outside the SVG so it is never captured by the
			 * exporter — snapdom serialises the SVG element only — and so it scales
			 * with the container without needing viewBox maths. Hidden while the
			 * artwork is being dragged so it never competes with that gesture.
			 */}
			{hasSeam && (
				<div
					className="pointer-events-none absolute inset-0 overflow-hidden"
					aria-hidden="true"
				>
					<div
						className={`absolute inset-y-0 w-px -translate-x-1/2 bg-white mix-blend-difference transition-opacity duration-150 ${
							isSeamHovered && !isDraggingArtwork ? "opacity-90" : "opacity-0"
						}`}
						style={{ left: `${CardBackSplit * 100}%` }}
					/>
				</div>
			)}
		</div>
	);
}
