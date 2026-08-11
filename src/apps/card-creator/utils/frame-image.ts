/**
 * Custom Cardback Upload/Resize Pipeline
 *
 * Normalises a user-uploaded frame image into the exact shape the renderer
 * expects: 900×1256 WebP (2x the 450×628 SVG viewBox, giving headroom for
 * scale=2.0 export with no upscaling), plus a small 225×314 WebP preview.
 * No new dependency — createImageBitmap + OffscreenCanvas + crypto.subtle.
 *
 * The pure geometry/format-detection helpers (sniffImageFormat,
 * coverCropRect, planHalvingSteps) are exported and tested directly, since
 * OffscreenCanvas/createImageBitmap aren't available under Bun's test runtime
 * and the async pipeline itself can only be exercised in a real browser.
 */

export const FRAME_IMAGE_WIDTH = 900;
export const FRAME_IMAGE_HEIGHT = 1256;
export const FRAME_PREVIEW_WIDTH = 225;
export const FRAME_PREVIEW_HEIGHT = 314;

/** Bumped if the resize target/quality ever changes. Stored alongside each
 * frameImages row so old rows remain identifiable without being invalidated. */
export const FRAME_NORM_VERSION = 1;

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_SOURCE_MEGAPIXELS = 50_000_000;
const MAX_SOURCE_DIMENSION = 12000;
const IMAGE_QUALITY = 0.92;
const PREVIEW_QUALITY = 0.8;

/**
 * Stable, translatable failure reasons for normaliseFrameImage. This module
 * has no access to a translation function (it's a pure utility, far from
 * React), so FrameImageError deliberately does NOT carry user-facing prose —
 * `.message` is a technical, English-only string for logs/debugging only.
 * The UI that calls normaliseFrameImage (the upload dialog) must switch on
 * `.code` and render `t(...)` itself, per CLAUDE.md's "no hardcoded strings"
 * rule — never display `.message` directly.
 */
export type FrameImageErrorCode =
	| "file-too-large"
	| "unrecognized-format"
	| "unreadable"
	| "dimensions-too-large"
	| "quota-exceeded";

export class FrameImageError extends Error {
	readonly code: FrameImageErrorCode;

	constructor(code: FrameImageErrorCode, message: string) {
		super(message);
		this.name = "FrameImageError";
		this.code = code;
	}
}

// ─── Pure helpers (unit-tested directly) ───────────────────────────────────

export type SniffedImageFormat = "png" | "webp";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Sniffs the first bytes of a file against real PNG/WebP magic numbers. This
 * — not ImageUpload's `file.type`/extension check, which is spoofable — is
 * the actual defense against e.g. an SVG (a script-execution vector) renamed
 * to `.png` reaching the image decoder. Covers exactly the two formats
 * accepted for custom frames; do not widen the accepted-format list without
 * also widening this.
 */
export function sniffImageFormat(head: Uint8Array): SniffedImageFormat | null {
	if (head.length >= 8 && PNG_SIGNATURE.every((byte, i) => head[i] === byte)) {
		return "png";
	}
	if (
		head.length >= 12 &&
		head[0] === 0x52 &&
		head[1] === 0x49 &&
		head[2] === 0x46 &&
		head[3] === 0x46 && // "RIFF"
		head[8] === 0x57 &&
		head[9] === 0x45 &&
		head[10] === 0x42 &&
		head[11] === 0x50 // "WEBP"
	) {
		return "webp";
	}
	return null;
}

/**
 * Reads width/height directly from PNG/WebP header bytes, without decoding
 * any pixels — so an extreme-dimension file can be rejected BEFORE
 * `createImageBitmap` allocates a full pixel buffer for it. Covers PNG
 * (exact, via the IHDR chunk) and WebP's extended VP8X container (exact,
 * covers the common case of larger/alpha WebP images). The simple lossy VP8
 * and lossless VP8L WebP sub-formats are NOT covered — those return null here
 * and fall through to the post-decode dimension check in
 * normaliseFrameImage, which is an acceptable residual gap since VP8X is what
 * encoders typically emit for images large enough to matter for this guard.
 */
export function readImageDimensionsFromHeader(
	head: Uint8Array,
): { width: number; height: number } | null {
	// PNG: 8-byte signature, then IHDR chunk: 4-byte length + "IHDR" (4 bytes)
	// + width (4 bytes, big-endian) + height (4 bytes, big-endian).
	if (head.length >= 24 && PNG_SIGNATURE.every((byte, i) => head[i] === byte)) {
		const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
		return {
			width: view.getUint32(16, false),
			height: view.getUint32(20, false),
		};
	}

	// WebP extended format (VP8X): "RIFF" + size(4) + "WEBP" + "VP8X" + chunk
	// size(4) + flags(1) + reserved(3) + (width-1) as 24-bit LE + (height-1)
	// as 24-bit LE.
	if (
		head.length >= 30 &&
		head[0] === 0x52 &&
		head[1] === 0x49 &&
		head[2] === 0x46 &&
		head[3] === 0x46 && // "RIFF"
		head[8] === 0x57 &&
		head[9] === 0x45 &&
		head[10] === 0x42 &&
		head[11] === 0x50 && // "WEBP"
		head[12] === 0x56 &&
		head[13] === 0x50 &&
		head[14] === 0x38 &&
		head[15] === 0x58 // "VP8X"
	) {
		const width = (head[24] | (head[25] << 8) | (head[26] << 16)) + 1;
		const height = (head[27] | (head[28] << 8) | (head[29] << 16)) + 1;
		return { width, height };
	}

	return null;
}

/**
 * Cover-fit ("xMidYMid slice") source crop rect: scales up just enough to
 * cover the target box, then centres. Matches the SVG renderer's own
 * `preserveAspectRatio="xMidYMid slice"` behavior on card-back images, so
 * stored bytes end up equal to rendered pixels instead of wasting storage on
 * parts of the upload that would be cropped away at render time anyway.
 */
export function coverCropRect(
	sourceWidth: number,
	sourceHeight: number,
	targetWidth: number,
	targetHeight: number,
): { sx: number; sy: number; sWidth: number; sHeight: number } {
	const scale = Math.max(
		targetWidth / sourceWidth,
		targetHeight / sourceHeight,
	);
	const sWidth = targetWidth / scale;
	const sHeight = targetHeight / scale;
	return {
		sx: (sourceWidth - sWidth) / 2,
		sy: (sourceHeight - sHeight) / 2,
		sWidth,
		sHeight,
	};
}

/**
 * Plans a sequence of intermediate (width, height) pairs for a stepwise
 * halving downscale from source to target dimensions. A single large-ratio
 * draw (e.g. 4000→900) visibly aliases the fine filigree typical of frame
 * art; halving repeatedly until within 2x of the target, then doing one
 * final draw, keeps quality acceptable. Returns an empty array when the
 * source is already within 2x of the target (no intermediate step needed).
 */
export function planHalvingSteps(
	sourceWidth: number,
	sourceHeight: number,
	targetWidth: number,
	targetHeight: number,
): { width: number; height: number }[] {
	const steps: { width: number; height: number }[] = [];
	let width = sourceWidth;
	let height = sourceHeight;
	while (width > targetWidth * 2 && height > targetHeight * 2) {
		width = Math.round(width / 2);
		height = Math.round(height / 2);
		steps.push({ width, height });
	}
	return steps;
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

// ─── Canvas plumbing ────────────────────────────────────────────────────────

async function drawScaled(
	source: ImageBitmap,
	sourceRect: {
		sx: number;
		sy: number;
		sWidth: number;
		sHeight: number;
	} | null,
	targetWidth: number,
	targetHeight: number,
): Promise<ImageBitmap> {
	const canvas = new OffscreenCanvas(targetWidth, targetHeight);
	const ctx = canvas.getContext("2d");
	// Not a FrameImageError: this isn't a validation failure about the user's
	// upload, it's an unsupported-environment condition with no translated
	// user message to show — a plain Error is correct here.
	if (!ctx) throw new Error("2D canvas context unavailable");
	ctx.imageSmoothingQuality = "high";
	if (sourceRect) {
		ctx.drawImage(
			source,
			sourceRect.sx,
			sourceRect.sy,
			sourceRect.sWidth,
			sourceRect.sHeight,
			0,
			0,
			targetWidth,
			targetHeight,
		);
	} else {
		ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
	}
	return createImageBitmap(canvas);
}

async function encodeWebp(bitmap: ImageBitmap, quality: number): Promise<Blob> {
	const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("2D canvas context unavailable");
	ctx.drawImage(bitmap, 0, 0);
	// Browsers without WebP encode support fall back to PNG per spec; the
	// caller records the real resulting Blob.type/size rather than assuming WebP.
	return canvas.convertToBlob({ type: "image/webp", quality });
}

// ─── Quota guard ────────────────────────────────────────────────────────────

/** Headroom kept beyond the image's own bytes, for the browser's other
 * IndexedDB/cache usage that `estimate()` can't attribute per-write. */
const QUOTA_SAFETY_MARGIN_BYTES = 5 * 1024 * 1024;

/**
 * Guards against writing a new frame image when the origin is at (or very
 * near) its storage quota — an IndexedDB write that fails partway through a
 * transaction because of quota is still atomic (Dexie's transaction rolls
 * back), but surfacing a clear error BEFORE the write is far better UX than a
 * generic transaction-failure. Only meaningful before a brand-new image
 * upload — adding a mirror to an already-stored image is metadata-only and
 * needs no guard. Silently no-ops (never blocks) in environments without the
 * Storage API (e.g. some private-browsing modes, older Safari).
 */
export async function assertStorageQuotaAvailable(
	requiredBytes: number,
): Promise<void> {
	if (!navigator.storage?.estimate) return;
	const { usage, quota } = await navigator.storage.estimate();
	if (usage == null || quota == null) return;
	if (quota - usage < requiredBytes + QUOTA_SAFETY_MARGIN_BYTES) {
		throw new FrameImageError(
			"quota-exceeded",
			"Not enough storage space available for this image.",
		);
	}
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

export interface NormalisedFrameImage {
	image: Blob;
	preview: Blob;
	/** SHA-256 of the original file's bytes, pre-resize. Upload-time dedup identity. */
	sourceHash: string;
	/** SHA-256 of the final, stored image bytes. Import-time reconciliation identity. */
	payloadHash: string;
	normVersion: number;
	byteSize: number;
	sourceWidth: number;
	sourceHeight: number;
}

/**
 * Normalises an uploaded frame image: validates format/size, decodes,
 * downscales to FRAME_IMAGE_WIDTH×FRAME_IMAGE_HEIGHT with a cover-fit crop,
 * and encodes both the stored image and a small preview as WebP. Runs once,
 * at upload time — never per card-save.
 */
export async function normaliseFrameImage(
	file: File,
): Promise<NormalisedFrameImage> {
	if (file.size > MAX_SOURCE_BYTES) {
		throw new FrameImageError(
			"file-too-large",
			`Image is too large (max ${MAX_SOURCE_BYTES / (1024 * 1024)}MB).`,
		);
	}

	// Hash raw file bytes BEFORE any decode — this is the dedup identity, and
	// computing it first lets a future caller short-circuit reuse without
	// paying for a decode/resize it doesn't need.
	const sourceHash = await sha256Hex(await file.arrayBuffer());

	// 30 bytes covers both the PNG IHDR chunk and a WebP VP8X header, so the
	// dimension pre-check below can run off the same read.
	const head = new Uint8Array(await file.slice(0, 30).arrayBuffer());
	if (!sniffImageFormat(head)) {
		throw new FrameImageError(
			"unrecognized-format",
			"Unrecognized image format — only PNG and WebP are supported.",
		);
	}

	// Reject an extreme-dimension file BEFORE createImageBitmap ever allocates
	// a full pixel buffer for it — a highly-compressible near-solid-color
	// image can be tiny on disk (well under MAX_SOURCE_BYTES) while still
	// being tens of thousands of pixels per side, and decode is where the
	// memory spike actually happens. Covers PNG and WebP/VP8X exactly; other
	// WebP sub-formats fall through to the post-decode check below.
	const headerDimensions = readImageDimensionsFromHeader(head);
	if (
		headerDimensions &&
		(headerDimensions.width * headerDimensions.height > MAX_SOURCE_MEGAPIXELS ||
			headerDimensions.width > MAX_SOURCE_DIMENSION ||
			headerDimensions.height > MAX_SOURCE_DIMENSION)
	) {
		throw new FrameImageError(
			"dimensions-too-large",
			"Image dimensions are too large.",
		);
	}

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		throw new FrameImageError("unreadable", "Couldn't read this image.");
	}

	const sourceWidth = bitmap.width;
	const sourceHeight = bitmap.height;
	if (
		sourceWidth * sourceHeight > MAX_SOURCE_MEGAPIXELS ||
		sourceWidth > MAX_SOURCE_DIMENSION ||
		sourceHeight > MAX_SOURCE_DIMENSION
	) {
		bitmap.close();
		throw new FrameImageError(
			"dimensions-too-large",
			"Image dimensions are too large.",
		);
	}

	// Stepwise halve until close to target. Each intermediate draw replaces
	// the previous ImageBitmap so earlier ones can be released promptly.
	let current = bitmap;
	for (const step of planHalvingSteps(
		sourceWidth,
		sourceHeight,
		FRAME_IMAGE_WIDTH,
		FRAME_IMAGE_HEIGHT,
	)) {
		const next = await drawScaled(current, null, step.width, step.height);
		current.close();
		current = next;
	}

	const cropRect = coverCropRect(
		current.width,
		current.height,
		FRAME_IMAGE_WIDTH,
		FRAME_IMAGE_HEIGHT,
	);
	const finalBitmap = await drawScaled(
		current,
		cropRect,
		FRAME_IMAGE_WIDTH,
		FRAME_IMAGE_HEIGHT,
	);
	if (current !== bitmap) current.close();
	bitmap.close();

	const previewBitmap = await drawScaled(
		finalBitmap,
		null,
		FRAME_PREVIEW_WIDTH,
		FRAME_PREVIEW_HEIGHT,
	);
	const [image, preview] = await Promise.all([
		encodeWebp(finalBitmap, IMAGE_QUALITY),
		encodeWebp(previewBitmap, PREVIEW_QUALITY),
	]);
	finalBitmap.close();
	previewBitmap.close();

	const payloadHash = await sha256Hex(await image.arrayBuffer());

	return {
		image,
		preview,
		sourceHash,
		payloadHash,
		normVersion: FRAME_NORM_VERSION,
		byteSize: image.size,
		sourceWidth,
		sourceHeight,
	};
}
