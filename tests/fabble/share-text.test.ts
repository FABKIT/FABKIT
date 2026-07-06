import { describe, expect, it } from "bun:test";
import { buildShareText } from "../../src/apps/fabble/game/share-text";
import type { TileState } from "../../src/apps/fabble/types";

describe("buildShareText", () => {
	it("builds a 3-guess win with no hints", () => {
		const rows: TileState[][] = [
			[
				"miss",
				"miss",
				"miss",
				"miss",
				"miss",
				"miss",
				"miss",
				"miss",
				"miss",
				"miss",
				"miss",
			],
			[
				"partial",
				"match",
				"miss",
				"match",
				"miss",
				"miss",
				"miss",
				"match",
				"miss",
				"miss",
				"miss",
			],
			[
				"match",
				"match",
				"match",
				"match",
				"match",
				"match",
				"match",
				"match",
				"match",
				"match",
				"match",
			],
		];
		const text = buildShareText({
			modeLabel: "Standard",
			dateLabel: "05-07-26",
			won: true,
			guessCount: 3,
			maxGuesses: 8,
			hintsUsed: 0,
			rows,
			link: "https://fabkit.io/fabble",
		});
		expect(text).toBe(
			"Fabble Standard · 05-07-26 · 3/8\n" +
				"🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥\n" +
				"🟨🟩🟥🟩🟥🟥🟥🟩🟥🟥🟥\n" +
				"🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n" +
				"https://fabkit.io/fabble",
		);
	});

	it("builds a defeat with hints used", () => {
		const missRow: TileState[] = new Array(11).fill("miss");
		const rows: TileState[][] = new Array(8).fill(missRow);
		const text = buildShareText({
			modeLabel: "Standard",
			dateLabel: "05-07-26",
			won: false,
			guessCount: 8,
			maxGuesses: 8,
			hintsUsed: 1,
			rows,
			link: "https://fabkit.io/fabble",
		});
		const expectedRow = "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥";
		expect(text).toBe(
			`Fabble Standard · 05-07-26 · X/8\nHints: 1/2\n${new Array(8).fill(expectedRow).join("\n")}\nhttps://fabkit.io/fabble`,
		);
	});
});
