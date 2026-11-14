import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { loadSetPrices } from "@fabkit/shared/data/fab-prices";
import { loadSetCardmarketPrices } from "@fabkit/shared/data/fab-prices-cm";
import {
	loadSetIndex,
	loadSetPrintings,
} from "@fabkit/shared/data/fab-printings";

/** A failed download must not stick: these loaders cache their in-flight
 * promise, and keeping a rejected one would block that data until a reload. */
describe("data loaders retry after a failure", () => {
	const realFetch = globalThis.fetch;
	let calls = 0;

	beforeEach(() => {
		calls = 0;
		globalThis.fetch = (async () => {
			calls += 1;
			if (calls === 1) return new Response("down", { status: 503 });
			return new Response(JSON.stringify({ sets: [] }), { status: 200 });
		}) as unknown as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = realFetch;
	});

	const loaders: Array<[string, () => Promise<unknown>]> = [
		["loadSetPrintings", () => loadSetPrintings("RETRY1")],
		["loadSetPrices", () => loadSetPrices("RETRY2")],
		["loadSetCardmarketPrices", () => loadSetCardmarketPrices("RETRY3")],
		["loadSetIndex", () => loadSetIndex()],
	];

	for (const [name, load] of loaders) {
		it(`${name} refetches instead of replaying the failure`, async () => {
			await expect(load()).rejects.toThrow();
			await expect(load()).resolves.toBeDefined();
			expect(calls).toBe(2);
		});
	}
});
