import { describe, expect, it } from "bun:test";
import { pickEndlessCard } from "../../src/apps/fabble/game/endless";
import { makeCard } from "./fixtures/dataset";

const cards = [
	makeCard({ id: "a" }),
	makeCard({ id: "b" }),
	makeCard({ id: "c" }),
];

describe("pickEndlessCard", () => {
	it("never returns an excluded card while alternatives remain", () => {
		for (let i = 0; i < 50; i++) {
			const picked = pickEndlessCard(cards, ["a", "b"]);
			expect(picked.id).toBe("c");
		}
	});

	it("falls back to the full pool once every card is excluded", () => {
		const picked = pickEndlessCard(cards, ["a", "b", "c"]);
		expect(cards.some((c) => c.id === picked.id)).toBe(true);
	});

	it("can return any card when nothing is excluded", () => {
		const seen = new Set<string>();
		for (let i = 0; i < 100; i++) {
			seen.add(pickEndlessCard(cards, []).id);
		}
		expect(seen.size).toBe(cards.length);
	});
});
