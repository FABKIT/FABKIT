import type * as React from "react";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { useCardCreator } from "../../../stores/card-creator";

interface CardArtworkPositionContainerProps {
	children: ReactNode;
	/** SVG-coordinate rect defining where drag initiates artwork movement. Touches outside fall through to native scroll. */
	artworkDragZone?: { x: number; y: number; width: number; height: number };
	/** SVG viewBox dimensions used to convert DOM coordinates into SVG space. */
	viewBox?: { width: number; height: number };
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
 */
export function CardArtworkPositionContainer({
	children,
	artworkDragZone,
	viewBox,
}: CardArtworkPositionContainerProps) {
	const CardArtPosition = useCardCreator((state) => state.CardArtPosition);
	const setCardArtPosition = useCardCreator(
		(state) => state.setCardArtPosition,
	);
	const containerRef = useRef<HTMLDivElement>(null);

	// isArtworkTouch: touch started inside the artwork zone — scroll must be suppressed.
	// isDragging: touch has moved past threshold — artwork position should update.
	// These are separate because scroll prevention must happen before threshold is crossed.
	const isArtworkTouch = useRef(false);
	const isDragging = useRef(false);
	const dragStart = useRef({ x: 0, y: 0 });
	const touchStartPos = useRef({ x: 0, y: 0 });
	const lastTouchDistance = useRef<number | null>(null);

	/**
	 * Returns true when (clientX, clientY) falls inside the artworkDragZone.
	 * Converts DOM viewport coordinates to SVG viewBox coordinates using the
	 * container's bounding rect and the known viewBox dimensions.
	 * Falls back to true (allow drag anywhere) when zone or viewBox is absent.
	 */
	const isInArtworkZone = useCallback(
		(clientX: number, clientY: number): boolean => {
			if (!artworkDragZone || !viewBox || !containerRef.current) return true;
			const rect = containerRef.current.getBoundingClientRect();
			const scaleX = rect.width / viewBox.width;
			const scaleY = rect.height / viewBox.height;
			const svgX = (clientX - rect.left) / scaleX;
			const svgY = (clientY - rect.top) / scaleY;
			return (
				svgX >= artworkDragZone.x &&
				svgX <= artworkDragZone.x + artworkDragZone.width &&
				svgY >= artworkDragZone.y &&
				svgY <= artworkDragZone.y + artworkDragZone.height
			);
		},
		[artworkDragZone, viewBox],
	);

	// Keep a stable ref to the latest touchmove logic so the native listener
	// (registered once in useEffect) always sees fresh store values.
	const touchMoveHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);
	touchMoveHandlerRef.current = (e: TouchEvent) => {
		if (e.touches.length === 1) {
			if (!isArtworkTouch.current) return;

			// Touch started in artwork zone — always prevent scroll for this gesture.
			e.preventDefault();

			if (!CardArtPosition) return;

			if (!isDragging.current) {
				const dx = e.touches[0].clientX - touchStartPos.current.x;
				const dy = e.touches[0].clientY - touchStartPos.current.y;
				if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
				isDragging.current = true;
			}

			setCardArtPosition({
				x: e.touches[0].clientX - dragStart.current.x,
				y: e.touches[0].clientY - dragStart.current.y,
				width: CardArtPosition.width,
				height: CardArtPosition.height,
			});
		} else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
			e.preventDefault();
			if (!CardArtPosition) return;

			const currentDistance = getTouchDistance(
				e.touches as unknown as React.TouchList,
			);
			if (currentDistance === null) return;

			const scaleFactor = currentDistance / lastTouchDistance.current;
			const newWidth = CardArtPosition.width * scaleFactor;
			const newHeight = CardArtPosition.height * scaleFactor;

			const minSize = 50;
			const maxSize = 5000;
			if (newWidth < minSize || newHeight < minSize) return;
			if (newWidth > maxSize || newHeight > maxSize) return;

			setCardArtPosition({
				x: CardArtPosition.x,
				y: CardArtPosition.y,
				width: newWidth,
				height: newHeight,
			});

			lastTouchDistance.current = currentDistance;
		}
	};

	// Register the non-passive native touchmove listener once.
	// React's onTouchMove would be passive and its e.preventDefault() is silently ignored.
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const handler = (e: TouchEvent) => touchMoveHandlerRef.current?.(e);
		el.addEventListener("touchmove", handler, { passive: false });
		return () => el.removeEventListener("touchmove", handler);
	}, []);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!isInArtworkZone(e.clientX, e.clientY)) return;
			dragStart.current = {
				x: e.clientX - (CardArtPosition?.x ?? 0),
				y: e.clientY - (CardArtPosition?.y ?? 0),
			};
			isDragging.current = true;
		},
		[CardArtPosition?.x, CardArtPosition?.y, isInArtworkZone],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging.current || !CardArtPosition) return;
			setCardArtPosition({
				x: e.clientX - dragStart.current.x,
				y: e.clientY - dragStart.current.y,
				width: CardArtPosition.width,
				height: CardArtPosition.height,
			});
		},
		[CardArtPosition, setCardArtPosition],
	);

	const handleMouseUp = useCallback(() => {
		isDragging.current = false;
	}, []);

	const handleMouseLeave = useCallback(() => {
		isDragging.current = false;
	}, []);

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			if (!CardArtPosition) return;
			e.preventDefault();
			const scaleFactor = 1 + -e.deltaY * 0.001;
			const newWidth = CardArtPosition.width * scaleFactor;
			const newHeight = CardArtPosition.height * scaleFactor;
			const minSize = 50;
			const maxSize = 5000;
			if (newWidth < minSize || newHeight < minSize) return;
			if (newWidth > maxSize || newHeight > maxSize) return;
			setCardArtPosition({
				x: CardArtPosition.x,
				y: CardArtPosition.y,
				width: newWidth,
				height: newHeight,
			});
		},
		[CardArtPosition, setCardArtPosition],
	);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 1) {
				if (!isInArtworkZone(e.touches[0].clientX, e.touches[0].clientY))
					return;
				isArtworkTouch.current = true;
				isDragging.current = false;
				touchStartPos.current = {
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
				};
				dragStart.current = {
					x: e.touches[0].clientX - (CardArtPosition?.x ?? 0),
					y: e.touches[0].clientY - (CardArtPosition?.y ?? 0),
				};
			} else if (e.touches.length === 2) {
				isArtworkTouch.current = false;
				isDragging.current = false;
				lastTouchDistance.current = getTouchDistance(e.touches);
			}
		},
		[CardArtPosition?.x, CardArtPosition?.y, isInArtworkZone],
	);

	const handleTouchEnd = useCallback(() => {
		isArtworkTouch.current = false;
		isDragging.current = false;
		lastTouchDistance.current = null;
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
