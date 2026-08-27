import { describe, expect, it } from "bun:test";
import {
	getCoverRect,
	getUnionRect,
} from "../src/apps/card-creator/preset-link/artwork-fit.ts";

/** The aperture measured from a stock dented frame, in viewBox units. */
const APERTURE = { x: 34, y: 79, width: 382, height: 304 };

const centreOf = (rect: {
	x: number;
	y: number;
	width: number;
	height: number;
}) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

describe("getCoverRect", () => {
	it("scales a small square source up until it covers the aperture", () => {
		const rect = getCoverRect(APERTURE, { width: 317, height: 317 });

		// Bound by the wider side, so the box is the aperture's width square.
		expect(rect.width).toBeCloseTo(382, 5);
		expect(rect.height).toBeCloseTo(382, 5);
		expect(centreOf(rect)).toEqual(centreOf(APERTURE));
	});

	it("scales a large source down rather than leaving it magnified", () => {
		const rect = getCoverRect(APERTURE, { width: 1440, height: 952 });

		expect(rect.width).toBeLessThan(1440);
		expect(rect.height).toBeCloseTo(304, 5);
		expect(centreOf(rect)).toEqual(centreOf(APERTURE));
	});

	it("keeps the source's aspect ratio, so the renderer crops nothing further", () => {
		const source = { width: 1440, height: 952 };
		const rect = getCoverRect(APERTURE, source);

		expect(rect.width / rect.height).toBeCloseTo(
			source.width / source.height,
			5,
		);
	});

	it("covers the target on both axes whatever the source's shape", () => {
		for (const source of [
			{ width: 317, height: 317 },
			{ width: 1440, height: 952 },
			{ width: 450, height: 628 },
			{ width: 96, height: 96 },
			{ width: 2000, height: 100 },
		]) {
			const rect = getCoverRect(APERTURE, source);
			expect(rect.width).toBeGreaterThanOrEqual(APERTURE.width - 1e-9);
			expect(rect.height).toBeGreaterThanOrEqual(APERTURE.height - 1e-9);
			expect(rect.x).toBeLessThanOrEqual(APERTURE.x + 1e-9);
			expect(rect.y).toBeLessThanOrEqual(APERTURE.y + 1e-9);
		}
	});

	it("leaves a source that already matches the target exactly where it is", () => {
		const rect = getCoverRect(APERTURE, {
			width: APERTURE.width,
			height: APERTURE.height,
		});

		expect(rect).toEqual(APERTURE);
	});
});

describe("getUnionRect", () => {
	it("spans both halves of a hybrid frame", () => {
		const left = { x: 34, y: 79, width: 200, height: 304 };
		const right = { x: 200, y: 70, width: 216, height: 300 };

		expect(getUnionRect(left, right)).toEqual({
			x: 34,
			y: 70,
			width: 382,
			height: 313,
		});
	});

	it("returns the outer rect when one contains the other", () => {
		const outer = { x: 0, y: 0, width: 450, height: 628 };
		const inner = APERTURE;

		expect(getUnionRect(outer, inner)).toEqual(outer);
		expect(getUnionRect(inner, outer)).toEqual(outer);
	});
});
