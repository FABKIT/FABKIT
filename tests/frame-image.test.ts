import { describe, expect, it } from "bun:test";
import {
	coverCropRect,
	planHalvingSteps,
	readImageDimensionsFromHeader,
	sniffImageFormat,
} from "../src/apps/card-creator/utils/frame-image.ts";

function pngHeader(width: number, height: number): Uint8Array {
	const bytes = new Uint8Array(24);
	bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); // signature
	bytes.set([0, 0, 0, 13], 8); // IHDR chunk length (unused by the parser)
	bytes.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
	new DataView(bytes.buffer).setUint32(16, width, false);
	new DataView(bytes.buffer).setUint32(20, height, false);
	return bytes;
}

function webpVp8xHeader(width: number, height: number): Uint8Array {
	const bytes = new Uint8Array(30);
	bytes.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
	bytes.set([0, 0, 0, 0], 4); // file size (unused by the parser)
	bytes.set([0x57, 0x45, 0x42, 0x50], 8); // "WEBP"
	bytes.set([0x56, 0x50, 0x38, 0x58], 12); // "VP8X"
	bytes.set([10, 0, 0, 0], 16); // chunk size (unused by the parser)
	bytes[20] = 0x10; // flags
	// bytes[21..23] reserved, left zero
	const w = width - 1;
	const h = height - 1;
	bytes.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff], 24);
	bytes.set([h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 27);
	return bytes;
}

// OffscreenCanvas/createImageBitmap aren't available under Bun's test
// runtime, so the async normaliseFrameImage pipeline itself can only be
// exercised in a real browser (see the Playwright checklist in the plan).
// These pure helpers are extracted specifically so the geometry and
// format-detection logic can still be unit-tested here.

describe("sniffImageFormat", () => {
	it("recognizes a real PNG signature", () => {
		const head = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
		]);
		expect(sniffImageFormat(head)).toBe("png");
	});

	it("recognizes a real WebP (RIFF....WEBP) signature", () => {
		const head = new Uint8Array([
			0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
		]);
		expect(sniffImageFormat(head)).toBe("webp");
	});

	it("rejects an SVG (the actual attack this sniffer exists to stop)", () => {
		const head = new TextEncoder().encode('<?xml version="1.0"?><svg');
		expect(sniffImageFormat(head)).toBeNull();
	});

	it("rejects a JPEG — frames need alpha, JPEG has none, deliberately unsupported", () => {
		const head = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
		expect(sniffImageFormat(head)).toBeNull();
	});

	it("rejects a RIFF container that isn't WEBP (e.g. a WAV file)", () => {
		const head = new Uint8Array([
			0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45,
		]);
		expect(sniffImageFormat(head)).toBeNull();
	});

	it("rejects a truncated/empty header", () => {
		expect(sniffImageFormat(new Uint8Array([0x89, 0x50]))).toBeNull();
		expect(sniffImageFormat(new Uint8Array())).toBeNull();
	});
});

describe("coverCropRect", () => {
	it("crops a wider-than-target source symmetrically on the x-axis", () => {
		// 1600x900 source into a 900x1256-ish (here simplified) target box.
		const rect = coverCropRect(1600, 900, 450, 628);
		expect(rect.sHeight).toBeCloseTo(900, 5);
		expect(rect.sy).toBeCloseTo(0, 5);
		expect(rect.sWidth).toBeLessThan(1600);
		expect(rect.sx).toBeCloseTo((1600 - rect.sWidth) / 2, 5);
	});

	it("crops a taller-than-target source symmetrically on the y-axis", () => {
		const rect = coverCropRect(900, 2000, 450, 628);
		expect(rect.sWidth).toBeCloseTo(900, 5);
		expect(rect.sx).toBeCloseTo(0, 5);
		expect(rect.sHeight).toBeLessThan(2000);
		expect(rect.sy).toBeCloseTo((2000 - rect.sHeight) / 2, 5);
	});

	it("is a no-op crop when the source already matches the target aspect ratio", () => {
		const rect = coverCropRect(450, 628, 900, 1256);
		expect(rect.sx).toBeCloseTo(0, 5);
		expect(rect.sy).toBeCloseTo(0, 5);
		expect(rect.sWidth).toBeCloseTo(450, 5);
		expect(rect.sHeight).toBeCloseTo(628, 5);
	});
});

describe("planHalvingSteps", () => {
	it("returns no steps when the source is already within 2x of the target", () => {
		expect(planHalvingSteps(1000, 1000, 900, 1256)).toEqual([]);
	});

	it("halves repeatedly until within 2x of the target", () => {
		const steps = planHalvingSteps(7200, 7200, 900, 1256);
		expect(steps.length).toBeGreaterThan(0);
		const last = steps[steps.length - 1];
		expect(last).toBeDefined();
		expect(last.width).toBeLessThanOrEqual(900 * 2);
		expect(last.height).toBeLessThanOrEqual(1256 * 2);
		// Monotonically decreasing.
		for (let i = 1; i < steps.length; i++) {
			expect(steps[i].width).toBeLessThan(steps[i - 1].width);
		}
	});
});

describe("readImageDimensionsFromHeader", () => {
	// This is the decode-bomb guard: it must reject an extreme-dimension file
	// BEFORE createImageBitmap decodes it, since a highly-compressible
	// near-solid-color image can be tiny on disk while still being huge in
	// pixels — the memory spike happens at decode, not at the byte-size check.

	it("reads PNG IHDR width/height exactly", () => {
		expect(readImageDimensionsFromHeader(pngHeader(450, 628))).toEqual({
			width: 450,
			height: 628,
		});
	});

	it("reads an extreme PNG dimension exactly (the decode-bomb case)", () => {
		expect(readImageDimensionsFromHeader(pngHeader(20000, 20000))).toEqual({
			width: 20000,
			height: 20000,
		});
	});

	it("reads WebP VP8X (width-1)/(height-1)-encoded dimensions exactly", () => {
		expect(readImageDimensionsFromHeader(webpVp8xHeader(900, 1256))).toEqual({
			width: 900,
			height: 1256,
		});
	});

	it("reads a 1x1 WebP VP8X image correctly (the width-1/height-1 edge case)", () => {
		expect(readImageDimensionsFromHeader(webpVp8xHeader(1, 1))).toEqual({
			width: 1,
			height: 1,
		});
	});

	it("returns null for a non-VP8X WebP chunk (simple VP8/VP8L — known residual gap)", () => {
		const bytes = webpVp8xHeader(900, 1256);
		bytes.set([0x56, 0x50, 0x38, 0x20], 12); // "VP8 " instead of "VP8X"
		expect(readImageDimensionsFromHeader(bytes)).toBeNull();
	});

	it("returns null for an unrecognized/truncated header", () => {
		expect(readImageDimensionsFromHeader(new Uint8Array(10))).toBeNull();
		expect(readImageDimensionsFromHeader(new Uint8Array())).toBeNull();
	});
});
