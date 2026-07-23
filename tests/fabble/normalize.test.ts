import { describe, expect, it } from "bun:test";
import { normalizeCardName } from "../../src/apps/fabble/game/normalize";

describe("normalizeCardName", () => {
	it("strips apostrophes so 'hunters' matches Hunter's Klaive", () => {
		expect(normalizeCardName("hunters klaive")).toBe(
			normalizeCardName("Hunter's Klaive"),
		);
	});

	it("folds the non-decomposable ð so 'vetrei' relates to Vetreiðr", () => {
		expect(normalizeCardName("Vetreiðr")).toBe("vetreidr");
	});

	it("is case-insensitive", () => {
		expect(normalizeCardName("DORINTHEA")).toBe(normalizeCardName("dorinthea"));
	});

	it("collapses whitespace", () => {
		expect(normalizeCardName("  Command   and   Conquer  ")).toBe(
			"command and conquer",
		);
	});

	it("strips combining diacritics via NFD", () => {
		expect(normalizeCardName("café")).toBe("cafe");
	});
});
