import { describe, expect, it } from "bun:test";
import { revealIntroTransform } from "@fabkit/apps/pack-opener/components/scene/revealIntro";
import {
	REVEAL_INTRO_MS,
	REVEAL_INTRO_START_SCALE,
	REVEAL_INTRO_START_Z,
} from "@fabkit/apps/pack-opener/config/scene";

/** The card's arrival transform. This is applied in two places that have to
 * agree exactly (CardStack3D's initial JSX props and its useFrame), which
 * is the whole reason it lives in a pure module rather than inline. */
describe("revealIntroTransform", () => {
	const START = 1_000_000;

	it("starts at the configured scale and depth", () => {
		const at = revealIntroTransform(START, START, false);
		expect(at.scale).toBeCloseTo(REVEAL_INTRO_START_SCALE, 6);
		expect(at.z).toBeCloseTo(REVEAL_INTRO_START_Z, 6);
	});

	it("is exactly at rest once the animation is over", () => {
		const at = revealIntroTransform(START, START + REVEAL_INTRO_MS, false);
		expect(at.scale).toBe(1);
		expect(at.z).toBe(0);
		// And stays there rather than overshooting on a later frame.
		const later = revealIntroTransform(START, START + 60_000, false);
		expect(later.scale).toBe(1);
		expect(later.z).toBe(0);
	});

	it("grows without ever moving backwards", () => {
		let previousScale = 0;
		let previousZ = -Infinity;
		for (let ms = 0; ms <= REVEAL_INTRO_MS; ms += 8) {
			const at = revealIntroTransform(START, START + ms, false);
			expect(at.scale).toBeGreaterThanOrEqual(previousScale);
			expect(at.z).toBeGreaterThanOrEqual(previousZ);
			previousScale = at.scale;
			previousZ = at.z;
		}
	});

	it("clamps a clock that reads before the start rather than overshooting", () => {
		// Wall-clock time can go backwards a little between the store's
		// timestamp and a frame callback. That must pin to the start of the
		// animation, never produce a scale below it.
		const at = revealIntroTransform(START, START - 500, false);
		expect(at.scale).toBeCloseTo(REVEAL_INTRO_START_SCALE, 6);
	});

	it("sits at rest with reduced motion, or before a pack has been opened", () => {
		expect(revealIntroTransform(START, START, true)).toEqual({
			scale: 1,
			z: 0,
		});
		expect(revealIntroTransform(null, START, false)).toEqual({
			scale: 1,
			z: 0,
		});
	});
});
