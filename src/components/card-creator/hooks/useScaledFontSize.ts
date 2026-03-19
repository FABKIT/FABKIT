import { useMemo } from "react";

/**
 * Card name scaling — width-box approach (mirrors real F&B card behaviour)
 */
export type CardNameScalingOptions = {
	/** The card name text to measure */
	text: string;
	/** Font family name — must match the SVG text element font */
	fontFamily: string;
	/** Font weight (default 400) */
	fontWeight?: number;
	/** Base font size used when the text fits within maxWidth */
	baseFontSize: number;
	/** Y position at baseFontSize (from preset) */
	baseY: number;
	/**
	 * Maximum allowed rendered text width in SVG units.
	 * Scaling only kicks in when this threshold is exceeded.
	 */
	maxWidth: number;
	/**
	 * Y position at minFontSize, used to interpolate the slight baseline shift
	 * observed on real cards when long names shrink.
	 * Defaults to baseY (no shift).
	 */
	scaledY?: number;
	/** Hard floor for font size (default 10) */
	minFontSize?: number;
};

/**
 * Scales the card name font size to fit a fixed-width box, only activating
 * when the text would exceed maxWidth at baseFontSize.
 *
 * Behaviour mirrors real Flesh and Blood cards:
 * - Short names → full baseFontSize, no scaling
 * - Long names  → font scales down so the text just fits maxWidth
 *
 * Uses canvas measureText() for font-aware width measurement, so the font
 * must be loaded in the browser for accurate results (it will be by the time
 * the user types a name).
 *
 * Also interpolates the Y position between baseY and scaledY to reproduce
 * the subtle baseline shift seen on real cards as font size decreases.
 */
export function useCardNameFontSize(options: CardNameScalingOptions): {
	fontSize: number;
	y: number;
} {
	const {
		text,
		fontFamily,
		fontWeight = 400,
		baseFontSize,
		baseY,
		maxWidth,
		scaledY = baseY,
		minFontSize = 10,
	} = options;

	return useMemo(() => {
		if (!text) return { fontSize: baseFontSize, y: baseY };

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		// Fallback to base values if canvas is unavailable (SSR / test env)
		if (!ctx) return { fontSize: baseFontSize, y: baseY };

		ctx.font = `${fontWeight} ${baseFontSize}px ${fontFamily}`;
		const measuredWidth = ctx.measureText(text).width;

		// Text fits — no scaling needed
		if (measuredWidth <= maxWidth) {
			return { fontSize: baseFontSize, y: baseY };
		}

		// Scale font down proportionally so text just fills maxWidth
		const scaledFontSize = Math.max(
			minFontSize,
			baseFontSize * (maxWidth / measuredWidth),
		);

		// Interpolate y: t=0 at baseFontSize (no scaling), t=1 at minFontSize (max scaling)
		const t = (baseFontSize - scaledFontSize) / (baseFontSize - minFontSize);
		const y = baseY + (scaledY - baseY) * t;

		return { fontSize: scaledFontSize, y };
	}, [
		text,
		fontFamily,
		fontWeight,
		baseFontSize,
		baseY,
		maxWidth,
		scaledY,
		minFontSize,
	]);
}

/**
 * Card text (description) scaling — binary search with DOM measurement
 */
export type CardTextScalingOptions = {
	/** HTML content from the Tiptap editor */
	html: string;
	/** Width of the foreignObject box in SVG units */
	boxWidth: number;
	/** Height of the foreignObject box in SVG units */
	boxHeight: number;
	/** Maximum (base) font size — used when text easily fits the box */
	maxFontSize: number;
	/** Minimum font size floor (default 6) */
	minFontSize?: number;
	/** Binary search precision in px (default 0.1) */
	precision?: number;
	/** Line height — must match the rendered div to measure correctly */
	lineHeight?: number;
	/** Paragraph spacing in em — must match the rendered div to measure correctly */
	paragraphSpacing?: number;
	/**
	 * Extra scaling factor applied only when overflow scaling was needed.
	 * Defaults to 1 (no extra scaling).
	 */
	overflowScalingFactor?: number;
};

/**
 * Persistent hidden measurement elements, created once and reused.
 * Avoids repeated DOM creation/destruction on every render.
 */
let measureContainer: HTMLDivElement | null = null;
let measureInner: HTMLDivElement | null = null;

function getMeasurementElements(): {
	container: HTMLDivElement;
	inner: HTMLDivElement;
} {
	if (!measureContainer || !measureInner) {
		measureContainer = document.createElement("div");
		measureContainer.style.position = "absolute";
		measureContainer.style.visibility = "hidden";
		measureContainer.style.left = "-9999px";
		measureContainer.style.top = "0";
		// Outer flex wrapper matching the NormalRenderer foreignObject layout
		measureContainer.style.display = "flex";
		measureContainer.style.flexDirection = "column";
		measureContainer.style.justifyContent = "center";
		measureContainer.style.alignItems = "center";

		measureInner = document.createElement("div");
		// Same CSS classes as the rendered card text div in NormalRenderer
		measureInner.className =
			"renderedContent text-black text-center font-card-text";

		measureContainer.appendChild(measureInner);
		document.body.appendChild(measureContainer);
	}
	return { container: measureContainer, inner: measureInner };
}

/**
 * Scales the card description font size to fit within a fixed-size box,
 * using a hidden DOM element for accurate measurement.
 *
 * This approach handles the full complexity of the card text:
 * - Rich text from the Tiptap editor (bold/italic font-family swaps)
 * - Custom emoji icons (.fab-icon, sized in em units)
 * - Lists, line breaks, and paragraph spacing
 * - Single-line center / multi-line left alignment (via CSS)
 *
 * Binary search converges in ~7 iterations (precision 0.1px) and reuses
 * a single persistent hidden DOM element to avoid layout thrashing.
 *
 * Compatible with the export system (html-to-image captures the final
 * fontSize set on the rendered element).
 */
export function useCardTextFontSize(options: CardTextScalingOptions): number {
	const {
		html,
		boxWidth,
		boxHeight,
		maxFontSize,
		minFontSize = 6,
		precision = 0.1,
		lineHeight,
		paragraphSpacing,
		overflowScalingFactor = 1,
	} = options;

	return useMemo(() => {
		if (!html) {
			return maxFontSize;
		}

		// Check for actual content (text or emoji icons)
		const plainText = html.replace(/<[^>]*>/g, "").trim();
		const hasEmojis = html.includes("fab-icon");
		if (!plainText && !hasEmojis) {
			return maxFontSize;
		}

		const { container, inner } = getMeasurementElements();

		// Match the foreignObject box width
		container.style.width = `${boxWidth}px`;
		// Apply the same spacing as the rendered div so measurement is accurate
		inner.style.lineHeight = lineHeight != null ? `${lineHeight}` : "1.18";
		inner.style.setProperty(
			"--paragraph-spacing",
			paragraphSpacing != null ? `${paragraphSpacing}em` : null,
		);
		inner.innerHTML = html;

		// Quick check: does everything fit at the base font size?
		inner.style.fontSize = `${maxFontSize}px`;
		if (inner.offsetHeight <= boxHeight) {
			return maxFontSize;
		}

		// Binary search for the largest font size that fits the box
		let low = minFontSize;
		let high = maxFontSize;

		while (high - low > precision) {
			const mid = (low + high) / 2;
			inner.style.fontSize = `${mid}px`;

			if (inner.offsetHeight <= boxHeight) {
				low = mid; // Fits — try larger
			} else {
				high = mid; // Overflows — try smaller
			}
		}

		// Apply extra scaling only when overflow scaling was needed
		return low < maxFontSize ? low * overflowScalingFactor : low;
	}, [
		html,
		boxWidth,
		boxHeight,
		maxFontSize,
		minFontSize,
		precision,
		lineHeight,
		paragraphSpacing,
		overflowScalingFactor,
	]);
}

/**
 * Generic length-based scaling (used for card body text and bottom text)
 */
export type ScaledFontSizeOptions = {
	/** The text content to measure */
	text: string;
	/** Base font size (used for reference length) */
	baseFontSize: number;
	/** Reference text length at which baseFontSize is ideal */
	referenceLength?: number;
	/** Minimum font size (prevents text from becoming too small) */
	minFontSize?: number;
	/** Maximum font size (prevents text from becoming too large) */
	maxFontSize?: number;
	/** Scaling factor (how aggressively to scale, default 0.5) */
	scalingFactor?: number;
};

/**
 * Calculate a font size that scales inversely with text length.
 * Shorter text = larger font, longer text = smaller font.
 *
 * @example
 * // For SVG text element
 * const fontSize = useScaledFontSize({
 *   text: CardName,
 *   baseFontSize: 24,
 *   referenceLength: 20,
 *   minFontSize: 16,
 *   maxFontSize: 32
 * });
 */
export function useScaledFontSize(options: ScaledFontSizeOptions): number {
	const {
		text,
		baseFontSize,
		referenceLength = 20,
		minFontSize = baseFontSize * 0.6,
		maxFontSize = baseFontSize * 1.5,
		scalingFactor = 0.5,
	} = options;

	return useMemo(() => {
		const textLength = text.length;

		// If text is shorter than reference, scale up
		// If text is longer than reference, scale down
		const ratio = referenceLength / Math.max(textLength, 1);

		// Apply scaling factor to make the effect more or less aggressive
		// scalingFactor = 1.0 means full scaling, 0.5 means moderate scaling
		const adjustedRatio = 1 + (ratio - 1) * scalingFactor;

		// Calculate the scaled font size
		const scaledSize = baseFontSize * adjustedRatio;

		// Clamp between min and max
		return Math.max(minFontSize, Math.min(maxFontSize, scaledSize));
	}, [
		text.length,
		baseFontSize,
		referenceLength,
		minFontSize,
		maxFontSize,
		scalingFactor,
	]);
}

/**
 * Calculate a font size for HTML content based on plain text length.
 * Use this for foreignObject scenarios where you can't control inner HTML.
 *
 * @example
 * // For foreignObject with uncontrolled HTML
 * const fontSize = useScaledFontSizeFromHTML({
 *   html: CardTextHTML,
 *   baseFontSize: 14,
 *   referenceLength: 100
 * });
 */
export function useScaledFontSizeFromHTML(
	options: Omit<ScaledFontSizeOptions, "text"> & { html: string },
): number {
	const { html, ...restOptions } = options;

	// Strip HTML tags to get approximate text length
	const plainText = useMemo(() => {
		return html.replace(/<[^>]*>/g, "");
	}, [html]);

	return useScaledFontSize({
		text: plainText,
		...restOptions,
	});
}
