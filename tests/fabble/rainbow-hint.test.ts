import { describe, expect, it } from "bun:test";
import { compareCards } from "../../src/apps/fabble/game/compare";
import { hasRainbowPartial } from "../../src/apps/fabble/game/rainbow-hint";
import { makeCard } from "./fixtures/dataset";

describe("hasRainbowPartial", () => {
	it("is true for a numeric partial (mono power vs rainbow answer)", () => {
		const guess = makeCard({ id: "a", powers: [4] });
		const answer = makeCard({ id: "b", powers: [3, 4, 5] });
		expect(hasRainbowPartial(compareCards(guess, answer))).toBe(true);
	});

	it("is true for a pitch partial", () => {
		const guess = makeCard({ id: "a", pitches: [1] });
		const answer = makeCard({ id: "b", pitches: [1, 2, 3] });
		expect(hasRainbowPartial(compareCards(guess, answer))).toBe(true);
	});

	it("is false for a class-only partial", () => {
		const guess = makeCard({ id: "a", classes: ["Warrior"] });
		const answer = makeCard({ id: "b", classes: ["Warrior", "Ninja"] });
		expect(hasRainbowPartial(compareCards(guess, answer))).toBe(false);
	});

	it("is false when there is no partial at all", () => {
		const guess = makeCard({ id: "a", powers: [4] });
		const answer = makeCard({ id: "b", powers: [4] });
		expect(hasRainbowPartial(compareCards(guess, answer))).toBe(false);
	});
});
