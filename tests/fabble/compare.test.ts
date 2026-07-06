import { describe, expect, it } from "bun:test";
import { compareCards } from "../../src/apps/fabble/game/compare";
import type { ColumnFeedback } from "../../src/apps/fabble/types";
import { fabbleDataset, makeCard } from "./fixtures/dataset";

function col(
	result: ReturnType<typeof compareCards>,
	id: string,
): ColumnFeedback {
	const found = result.columns.find((c) => c.column === id);
	if (!found) throw new Error(`missing column ${id}`);
	return found;
}

describe("compareCards — type", () => {
	it("matches on equal type", () => {
		const a = makeCard({ id: "a", type: "hero" });
		const b = makeCard({ id: "b", type: "hero" });
		expect(col(compareCards(a, b), "type").state).toBe("match");
	});

	it("misses on different type, no direction/ban", () => {
		const a = makeCard({ id: "a", type: "hero" });
		const b = makeCard({ id: "b", type: "weapon" });
		const c = col(compareCards(a, b), "type");
		expect(c.state).toBe("miss");
		expect(c.direction).toBeUndefined();
		expect(c.notApplicable).toBeUndefined();
	});
});

describe("compareCards — class", () => {
	it("identical multi-class matches", () => {
		const a = makeCard({ id: "a", classes: ["Warrior", "Ninja"] });
		const b = makeCard({ id: "b", classes: ["Warrior", "Ninja"] });
		expect(col(compareCards(a, b), "class").state).toBe("match");
	});

	it("partial overlap shows shared classes", () => {
		const a = makeCard({ id: "a", classes: ["Warrior"] });
		const b = makeCard({ id: "b", classes: ["Warrior", "Ninja"] });
		const c = col(compareCards(a, b), "class");
		expect(c.state).toBe("partial");
		expect(c.shared).toEqual(["Warrior"]);
	});

	it("disjoint classes miss plainly", () => {
		const a = makeCard({ id: "a", classes: ["Guardian"] });
		const b = makeCard({ id: "b", classes: ["Warrior"] });
		const c = col(compareCards(a, b), "class");
		expect(c.state).toBe("miss");
		expect(c.notApplicable).toBeUndefined();
	});

	it("bans when answer has no class and guess does", () => {
		const a = makeCard({ id: "a", classes: ["Guardian"] });
		const b = makeCard({ id: "b", classes: [] });
		expect(col(compareCards(a, b), "class").notApplicable).toBe(true);
	});

	it("both classless matches", () => {
		const a = makeCard({ id: "a", classes: [] });
		const b = makeCard({ id: "b", classes: [] });
		expect(col(compareCards(a, b), "class").state).toBe("match");
	});

	it("Generic vs Generic matches", () => {
		const a = makeCard({ id: "a", classes: ["Generic"] });
		const b = makeCard({ id: "b", classes: ["Generic"] });
		expect(col(compareCards(a, b), "class").state).toBe("match");
	});
});

describe("compareCards — talent", () => {
	it("both none matches", () => {
		const a = makeCard({ id: "a", talents: [] });
		const b = makeCard({ id: "b", talents: [] });
		expect(col(compareCards(a, b), "talent").state).toBe("match");
	});

	it("shared one of two is partial", () => {
		const a = makeCard({ id: "a", talents: ["Elemental"] });
		const b = makeCard({ id: "b", talents: ["Elemental", "Shadow"] });
		const c = col(compareCards(a, b), "talent");
		expect(c.state).toBe("partial");
		expect(c.shared).toEqual(["Elemental"]);
	});

	it("answer none, guess has one bans", () => {
		const a = makeCard({ id: "a", talents: ["Draconic"] });
		const b = makeCard({ id: "b", talents: [] });
		expect(col(compareCards(a, b), "talent").notApplicable).toBe(true);
	});

	it("guess none, answer has one is plain miss (ban is answer-lacks only)", () => {
		const a = makeCard({ id: "a", talents: [] });
		const b = makeCard({ id: "b", talents: ["Light"] });
		const c = col(compareCards(a, b), "talent");
		expect(c.state).toBe("miss");
		expect(c.notApplicable).toBeUndefined();
	});
});

describe("compareCards — pitch", () => {
	it("rainbow guess matches and flags isRainbow", () => {
		const a = makeCard({ id: "a", pitches: [1, 2, 3] });
		const b = makeCard({ id: "b", pitches: [2] });
		const c = col(compareCards(a, b), "pitch");
		expect(c.state).toBe("match");
		expect(c.isRainbow).toBe(true);
	});

	it("both none matches", () => {
		const a = makeCard({ id: "a", pitches: [] });
		const b = makeCard({ id: "b", pitches: [] });
		expect(col(compareCards(a, b), "pitch").state).toBe("match");
	});

	it("[1] vs [1] matches", () => {
		const a = makeCard({ id: "a", pitches: [1] });
		const b = makeCard({ id: "b", pitches: [1] });
		expect(col(compareCards(a, b), "pitch").state).toBe("match");
	});

	it("[1] vs [2] misses plainly", () => {
		const a = makeCard({ id: "a", pitches: [1] });
		const b = makeCard({ id: "b", pitches: [2] });
		const c = col(compareCards(a, b), "pitch");
		expect(c.state).toBe("miss");
		expect(c.direction).toBeUndefined();
		expect(c.notApplicable).toBeUndefined();
	});

	it("[1,3] vs [3] matches", () => {
		const a = makeCard({ id: "a", pitches: [1, 3] });
		const b = makeCard({ id: "b", pitches: [3] });
		expect(col(compareCards(a, b), "pitch").state).toBe("match");
	});

	it("[2] guess vs rainbow answer matches without isRainbow", () => {
		const a = makeCard({ id: "a", pitches: [2] });
		const b = makeCard({ id: "b", pitches: [1, 2, 3] });
		const c = col(compareCards(a, b), "pitch");
		expect(c.state).toBe("match");
		expect(c.isRainbow).toBeUndefined();
	});
});

describe("compareCards — cost", () => {
	it("2 vs 2 matches", () => {
		const a = makeCard({ id: "a", costs: [2] });
		const b = makeCard({ id: "b", costs: [2] });
		expect(col(compareCards(a, b), "cost").state).toBe("match");
	});

	it("1 vs 3 is higher, reveals 3", () => {
		const a = makeCard({ id: "a", costs: [1] });
		const b = makeCard({ id: "b", costs: [3] });
		const c = col(compareCards(a, b), "cost");
		expect(c.direction).toBe("higher");
		expect(c.revealedValue).toBe("3");
	});

	it("4 vs 2 is lower", () => {
		const a = makeCard({ id: "a", costs: [4] });
		const b = makeCard({ id: "b", costs: [2] });
		expect(col(compareCards(a, b), "cost").direction).toBe("lower");
	});

	it("X vs 3 has no arrow", () => {
		const a = makeCard({ id: "a", costs: ["X"] });
		const b = makeCard({ id: "b", costs: [3] });
		const c = col(compareCards(a, b), "cost");
		expect(c.state).toBe("miss");
		expect(c.direction).toBeUndefined();
	});

	it("X vs X matches", () => {
		const a = makeCard({ id: "a", costs: ["X"] });
		const b = makeCard({ id: "b", costs: ["X"] });
		expect(col(compareCards(a, b), "cost").state).toBe("match");
	});

	it("[] vs [] matches", () => {
		const a = makeCard({ id: "a", costs: [] });
		const b = makeCard({ id: "b", costs: [] });
		expect(col(compareCards(a, b), "cost").state).toBe("match");
	});

	it("guess 2 vs answer [] bans", () => {
		const a = makeCard({ id: "a", costs: [2] });
		const b = makeCard({ id: "b", costs: [] });
		expect(col(compareCards(a, b), "cost").notApplicable).toBe(true);
	});

	it("guess [] vs answer 2 is plain miss, no reveal", () => {
		const a = makeCard({ id: "a", costs: [] });
		const b = makeCard({ id: "b", costs: [2] });
		const c = col(compareCards(a, b), "cost");
		expect(c.state).toBe("miss");
		expect(c.notApplicable).toBeUndefined();
		expect(c.revealedValue).toBeUndefined();
	});

	it("[2,3] vs [3] matches", () => {
		const a = makeCard({ id: "a", costs: [2, 3] });
		const b = makeCard({ id: "b", costs: [3] });
		expect(col(compareCards(a, b), "cost").state).toBe("match");
	});

	it("[0,1] vs [4] is higher", () => {
		const a = makeCard({ id: "a", costs: [0, 1] });
		const b = makeCard({ id: "b", costs: [4] });
		expect(col(compareCards(a, b), "cost").direction).toBe("higher");
	});

	it("[1,5] vs [3] is a plain miss (straddle)", () => {
		const a = makeCard({ id: "a", costs: [1, 5] });
		const b = makeCard({ id: "b", costs: [3] });
		const c = col(compareCards(a, b), "cost");
		expect(c.state).toBe("miss");
		expect(c.direction).toBeUndefined();
	});
});

describe("compareCards — power", () => {
	it("* vs 4 has no arrow", () => {
		const a = makeCard({ id: "a", powers: ["*"] });
		const b = makeCard({ id: "b", powers: [4] });
		expect(col(compareCards(a, b), "power").direction).toBeUndefined();
	});

	it("has a higher case", () => {
		const a = makeCard({ id: "a", powers: [1] });
		const b = makeCard({ id: "b", powers: [5] });
		expect(col(compareCards(a, b), "power").direction).toBe("higher");
	});

	it("has a lower case", () => {
		const a = makeCard({ id: "a", powers: [5] });
		const b = makeCard({ id: "b", powers: [1] });
		expect(col(compareCards(a, b), "power").direction).toBe("lower");
	});

	it("has a ban case", () => {
		const a = makeCard({ id: "a", powers: [3] });
		const b = makeCard({ id: "b", powers: [] });
		expect(col(compareCards(a, b), "power").notApplicable).toBe(true);
	});
});

describe("compareCards — defense", () => {
	it("has a match case", () => {
		const a = makeCard({ id: "a", defenses: [2] });
		const b = makeCard({ id: "b", defenses: [2] });
		expect(col(compareCards(a, b), "defense").state).toBe("match");
	});

	it("has a directional case", () => {
		const a = makeCard({ id: "a", defenses: [1] });
		const b = makeCard({ id: "b", defenses: [4] });
		expect(col(compareCards(a, b), "defense").direction).toBe("higher");
	});

	it("has a ban case", () => {
		const a = makeCard({ id: "a", defenses: [2] });
		const b = makeCard({ id: "b", defenses: [] });
		expect(col(compareCards(a, b), "defense").notApplicable).toBe(true);
	});
});

describe("compareCards — life", () => {
	it("hero 20 vs 18 is lower, reveals 18", () => {
		const a = makeCard({ id: "a", type: "hero", life: 20 });
		const b = makeCard({ id: "b", type: "hero", life: 18 });
		const c = col(compareCards(a, b), "life");
		expect(c.direction).toBe("lower");
		expect(c.revealedValue).toBe("18");
	});

	it("null vs null matches", () => {
		const a = makeCard({ id: "a", type: "action", life: null });
		const b = makeCard({ id: "b", type: "action", life: null });
		expect(col(compareCards(a, b), "life").state).toBe("match");
	});

	it("action guess vs hero answer is a plain miss", () => {
		const a = makeCard({ id: "a", type: "action", life: null });
		const b = makeCard({ id: "b", type: "hero", life: 20 });
		const c = col(compareCards(a, b), "life");
		expect(c.state).toBe("miss");
		expect(c.notApplicable).toBeUndefined();
	});

	it("hero guess vs action answer bans", () => {
		const a = makeCard({ id: "a", type: "hero", life: 20 });
		const b = makeCard({ id: "b", type: "action", life: null });
		expect(col(compareCards(a, b), "life").notApplicable).toBe(true);
	});
});

describe("compareCards — subtypes", () => {
	it("identical matches", () => {
		const a = makeCard({ id: "a", subtypes: ["Attack"] });
		const b = makeCard({ id: "b", subtypes: ["Attack"] });
		expect(col(compareCards(a, b), "subtypes").state).toBe("match");
	});

	it("overlap is partial with shared", () => {
		const a = makeCard({ id: "a", subtypes: ["Attack"] });
		const b = makeCard({ id: "b", subtypes: ["Attack", "Sword"] });
		const c = col(compareCards(a, b), "subtypes");
		expect(c.state).toBe("partial");
		expect(c.shared).toEqual(["Attack"]);
	});

	it("both none matches", () => {
		const a = makeCard({ id: "a", subtypes: [] });
		const b = makeCard({ id: "b", subtypes: [] });
		expect(col(compareCards(a, b), "subtypes").state).toBe("match");
	});

	it("answer none, guess has one is plain miss, NOT ban", () => {
		const a = makeCard({ id: "a", subtypes: ["Attack"] });
		const b = makeCard({ id: "b", subtypes: [] });
		const c = col(compareCards(a, b), "subtypes");
		expect(c.state).toBe("miss");
		expect(c.notApplicable).toBeUndefined();
	});
});

describe("compareCards — keywords", () => {
	it("mirrors subtypes shapes", () => {
		const a = makeCard({ id: "a", keywords: ["Go again"] });
		const b = makeCard({ id: "b", keywords: [] });
		const c = col(compareCards(a, b), "keywords");
		expect(c.state).toBe("miss");
		expect(c.notApplicable).toBeUndefined();
	});
});

describe("compareCards — set", () => {
	it("matches on shared code even with other printings differing", () => {
		const a = makeCard({
			id: "a",
			sets: [
				{ code: "WTR", name: "Welcome to Rathe", order: 0 },
				{ code: "ARC", name: "Arcane Rising", order: 1 },
			],
		});
		const b = makeCard({
			id: "b",
			sets: [{ code: "WTR", name: "Welcome to Rathe", order: 0 }],
		});
		const result = compareCards(a, b);
		const c = col(result, "set");
		expect(c.state).toBe("match");
		expect(c.setDetails?.find((s) => s.code === "WTR")?.mark).toBe("check");
	});

	it("disjoint entirely newer answer marks all higher", () => {
		const a = makeCard({
			id: "a",
			sets: [{ code: "WTR", name: "Welcome to Rathe", order: 0 }],
		});
		const b = makeCard({
			id: "b",
			sets: [{ code: "MON", name: "Monarch", order: 3 }],
		});
		const c = col(compareCards(a, b), "set");
		expect(c.setDetails?.every((s) => s.mark === "higher")).toBe(true);
	});

	it("disjoint entirely older answer marks all lower", () => {
		const a = makeCard({
			id: "a",
			sets: [{ code: "MON", name: "Monarch", order: 3 }],
		});
		const b = makeCard({
			id: "b",
			sets: [{ code: "WTR", name: "Welcome to Rathe", order: 0 }],
		});
		const c = col(compareCards(a, b), "set");
		expect(c.setDetails?.every((s) => s.mark === "lower")).toBe(true);
	});

	it("straddled printings mark null", () => {
		const a = makeCard({
			id: "a",
			sets: [{ code: "ELE", name: "Tales of Aria", order: 4 }],
		});
		const b = makeCard({
			id: "b",
			sets: [
				{ code: "ARC", name: "Arcane Rising", order: 1 },
				{ code: "MST", name: "Part the Mistveil", order: 8 },
			],
		});
		const c = col(compareCards(a, b), "set");
		expect(c.setDetails?.find((s) => s.code === "ELE")?.mark).toBeNull();
	});

	it("non-promo entries sort newest-first, promos pinned to top", () => {
		const a = makeCard({
			id: "a",
			sets: [
				{ code: "WTR", name: "Welcome to Rathe", order: 0 },
				{ code: "ARC", name: "Arcane Rising", order: 1 },
				{ code: "PROMO", name: "Promo", order: 9, promo: true },
			],
		});
		const b = makeCard({
			id: "b",
			sets: [{ code: "CRU", name: "Crucible of War", order: 2 }],
		});
		const c = col(compareCards(a, b), "set");
		expect(c.setDetails?.map((s) => s.code)).toEqual(["PROMO", "ARC", "WTR"]);
	});

	it("shared promo marks check", () => {
		const a = makeCard({
			id: "a",
			sets: [{ code: "PROMO", name: "Promo", order: 9, promo: true }],
		});
		const b = makeCard({
			id: "b",
			sets: [{ code: "PROMO", name: "Promo", order: 9, promo: true }],
		});
		const c = col(compareCards(a, b), "set");
		expect(c.setDetails?.[0]?.mark).toBe("check");
	});

	it("unshared promo marks null even when answer is entirely newer", () => {
		const a = makeCard({
			id: "a",
			sets: [{ code: "PROMO", name: "Promo", order: 9, promo: true }],
		});
		const b = makeCard({
			id: "b",
			sets: [{ code: "MON", name: "Monarch", order: 3 }],
		});
		const c = col(compareCards(a, b), "set");
		expect(c.setDetails?.[0]?.mark).toBeNull();
	});
});

describe("compareCards — twin", () => {
	it("flags the fixture twin pair as isTwin, not correct", () => {
		const twinA = fabbleDataset.cards.find((c) => c.id === "whispering-mists");
		const twinB = fabbleDataset.cards.find((c) => c.id === "echoing-mists");
		if (!twinA || !twinB) throw new Error("fixture twin pair missing");
		const result = compareCards(twinA, twinB);
		expect(result.isTwin).toBe(true);
		expect(result.correct).toBe(false);
		expect(result.columns.every((c) => c.state === "match")).toBe(true);
	});

	it("self-compare is correct, not a twin", () => {
		const card = fabbleDataset.cards[0];
		const result = compareCards(card, card);
		expect(result.correct).toBe(true);
		expect(result.isTwin).toBe(false);
	});
});
