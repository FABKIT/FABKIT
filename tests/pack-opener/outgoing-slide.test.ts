import { describe, expect, it } from "bun:test";
import { outgoingSlideTransform } from "@fabkit/apps/pack-opener/components/scene/outgoingSlide";
import {
	CARD_SLIDE_DISTANCE,
	REVEAL_TRANSITION_MS,
} from "@fabkit/apps/pack-opener/config/scene";

/** The outgoing card's slide. Applied both as the group's initial JSX props
 * and every frame, which is why it is a pure function: the two must agree
 * exactly or the card underneath shows through for a frame. */
describe("outgoingSlideTransform", () => {
	const START = 5_000_000;

	it("starts covering the card underneath", () => {
		// The whole point: at the instant a reveal begins the outgoing card is
		// visible and exactly on top of the incoming one. If this were hidden
		// or already moved, the next card would flash through.
		const at = outgoingSlideTransform(START, START);
		expect(at.y).toBe(0);
		expect(at.rotationZ).toBe(0);
		expect(at.visible).toBe(true);
	});

	it("has fully cleared the frame and hidden itself when done", () => {
		const at = outgoingSlideTransform(START, START + REVEAL_TRANSITION_MS);
		expect(at.y).toBeCloseTo(CARD_SLIDE_DISTANCE, 6);
		expect(at.visible).toBe(false);
	});

	it("only ever moves upward", () => {
		let previous = -1;
		for (let ms = 0; ms <= REVEAL_TRANSITION_MS; ms += 8) {
			const at = outgoingSlideTransform(START, START + ms);
			expect(at.y).toBeGreaterThanOrEqual(previous);
			previous = at.y;
		}
	});

	it("clamps a clock reading before the start back to full cover", () => {
		// Taps can arrive faster than the slide lasts, so a new slide often
		// begins while the last is still moving. Every one of those has to
		// start from cover, never from a negative offset.
		const at = outgoingSlideTransform(START, START - 250);
		expect(at.y).toBe(0);
		expect(at.visible).toBe(true);
	});

	it("is finished and hidden when there is no reveal in progress", () => {
		const at = outgoingSlideTransform(null, START);
		expect(at.visible).toBe(false);
	});
});
