import { describe, expect, it } from "bun:test";
import { resolveCardBack } from "../src/apps/card-creator/preset-link/resolve.ts";
import { CardBacks } from "../src/shared/config/cards/card_backs.ts";

describe("resolveCardBack", () => {
	it("returns null for a null reference", () => {
		expect(resolveCardBack(null)).toBeNull();
	});

	it("resolves a stock id from the manifest", () => {
		const target = CardBacks[0];
		const resolved = resolveCardBack({ id: target.id });
		expect(resolved?.id).toBe(target.id);
		expect(resolved?.name).toBe(target.name);
	});

	it("returns null for a stock id that doesn't exist in the manifest", () => {
		const bogusId = Math.max(...CardBacks.map((b) => b.id)) + 1000;
		const resolved = resolveCardBack({ id: bogusId });
		expect(resolved).toBeNull();
	});
});
