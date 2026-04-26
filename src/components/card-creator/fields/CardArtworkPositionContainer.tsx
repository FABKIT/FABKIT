import type * as React from "react";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
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
			if (!isArtworkTouch.current) return;

			// Touch started in artwork zone — always prevent scroll for this gesture.
			e.preventDefault();

			if (!isDragging.current) {
				const dx = e.touches[0].clientX - touchStartPos.current.x;
				const dy = e.touches[0].clientY - touchStartPos.current.y;
				if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
				isDragging.current = true;
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

	// Register the non-passive native touchmove listener once.
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const handler = (e: TouchEvent) => touchMoveHandlerRef.current?.(e);
		el.addEventListener("touchmove", handler, { passive: false });
		return () => el.removeEventListener("touchmove", handler);
	}, []);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
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
		],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
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
		],
	);

	const handleMouseUp = useCallback(() => {
		isDragging.current = false;
		meldDragHalf.current = null;
	}, []);

	const handleMouseLeave = useCallback(() => {
		isDragging.current = false;
		meldDragHalf.current = null;
	}, []);

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			const scaleFactor = 1 + -e.deltaY * 0.001;

			if (isMeldMode) {
				// Scale artwork for whichever half the cursor is over
				const half = getMeldDragHalf(e.clientX, e.clientY);
				if (!half) return;
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
		},
		[
			isMeldMode,
			getMeldDragHalf,
			meldHalfA.CardArtPosition,
			meldHalfB.CardArtPosition,
			setMeldHalfArtPosition,
			CardArtPosition,
			setCardArtPosition,
		],
	);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 1) {
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
		],
	);

	const handleTouchEnd = useCallback(() => {
		isArtworkTouch.current = false;
		isDragging.current = false;
		lastTouchDistance.current = null;
		meldDragHalf.current = null;
	}, []);

	return (
		<div
			ref={containerRef}
			role="application"
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
			onWheel={handleWheel}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
		>
			{children}
		</div>
	);
}
