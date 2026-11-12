import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { isPrecachedImage } from "../../scripts/update-pwa-assets";

/** CARD_BACK_URL as the precache lists it: relative to public/. */
const CARD_BACK_ASSET = CARD_BACK_URL.replace(/^\//, "");

describe("the pack opener and the service worker precache", () => {
	// The loading and offline screens show the card back before any of the
	// app's own code has arrived, so it has to be on the device already.
	test("the card back is precached by the deploy's asset scan", () => {
		expect(isPrecachedImage(CARD_BACK_ASSET)).toBe(true);
	});

	test("the card back is in the checked-in precache list", async () => {
		const config = await readFile("vite.config.ts", "utf8");
		expect(config).toContain(`"${CARD_BACK_ASSET}"`);
	});

	// Several megabytes that only this app's players ever see.
	test("pack artwork and set logos stay out of the precache", () => {
		expect(isPrecachedImage("img/pack-opener/packs/WTR/1.webp")).toBe(false);
		expect(isPrecachedImage("img/pack-opener/logos/ANQ.webp")).toBe(false);
	});

	test("images outside the pack opener are unaffected", () => {
		expect(isPrecachedImage("img/rarities/common.svg")).toBe(true);
	});
});
