import { describe, expect, it } from "bun:test";
import {
	buildSearchIndex,
	searchCards,
} from "../../src/apps/fabble/game/search";
import { fabbleDataset } from "./fixtures/dataset";

const index = buildSearchIndex(fabbleDataset.cards);

describe("searchCards", () => {
	it("ranks startsWith matches before includes matches", () => {
		const results = searchCards(index, "st");
		const startsWithIds = index
			.filter((e) => e.normalized.startsWith("st"))
			.map((e) => e.id);
		expect(results.slice(0, startsWithIds.length).map((r) => r.id)).toEqual(
			expect.arrayContaining(startsWithIds),
		);
	});

	it("caps results at 10", () => {
		const results = searchCards(index, "e");
		expect(results.length).toBeLessThanOrEqual(10);
	});

	it("matches accented queries against folded names", () => {
		const results = searchCards(index, "dorinthea");
		expect(results.some((r) => r.name === "Dorinthea Ironsong")).toBe(true);
	});

	it("returns [] for garbage input", () => {
		expect(searchCards(index, "!!!???")).toEqual([]);
	});

	it("returns [] for an empty query", () => {
		expect(searchCards(index, "")).toEqual([]);
	});
});
