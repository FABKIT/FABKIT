import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import {
	clearFailedTextureUrls,
	preloadSafeTexture,
	trimSafeTextureCache,
} from "@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture";
import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { SRGBColorSpace, Texture, TextureLoader } from "three";

/** Lets the loader's fake callback and the promise chain behind it settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

type LoadArgs = Parameters<TextureLoader["load"]>;

/** Replaces the real image download. Every test uses its own URLs, because the
 * module's cache outlives a test. */
function fakeLoader(outcome: (url: string) => Texture | "fail") {
	return spyOn(TextureLoader.prototype, "load").mockImplementation(((
		url: LoadArgs[0],
		onLoad: LoadArgs[1],
		_onProgress: LoadArgs[2],
		onError: LoadArgs[3],
	) => {
		const result = outcome(url);
		setTimeout(() => {
			if (result === "fail") onError?.(new Error("404"));
			else onLoad?.(result);
		}, 0);
		return new Texture();
	}) as TextureLoader["load"]);
}

afterEach(() => {
	mock.restore();
});

describe("preloadSafeTexture", () => {
	it("shares one download between requests for the same URL", async () => {
		const load = fakeLoader(() => new Texture());
		preloadSafeTexture("/dedupe.webp");
		preloadSafeTexture("/dedupe.webp");
		await settle();
		preloadSafeTexture("/dedupe.webp");
		expect(load).toHaveBeenCalledTimes(1);
	});

	it("flags a texture as sRGB as it loads, whoever asks for it first", async () => {
		const texture = new Texture();
		fakeLoader(() => texture);
		preloadSafeTexture("/colour.webp");
		await settle();
		expect(texture.colorSpace).toBe(SRGBColorSpace);
	});
});

describe("clearFailedTextureUrls", () => {
	it("gives a failed URL another try, and not before", async () => {
		const load = fakeLoader(() => "fail");
		preloadSafeTexture("/flaky.webp");
		await settle();
		preloadSafeTexture("/flaky.webp");
		expect(load).toHaveBeenCalledTimes(1);

		clearFailedTextureUrls();
		preloadSafeTexture("/flaky.webp");
		expect(load).toHaveBeenCalledTimes(2);
		await settle();
	});
});

describe("trimSafeTextureCache", () => {
	it("disposes the oldest textures but never the card back", async () => {
		const textures = new Map<string, Texture>();
		const load = fakeLoader((url) => {
			const texture = new Texture();
			textures.set(url, texture);
			return texture;
		});
		trimSafeTextureCache(0);

		preloadSafeTexture(CARD_BACK_URL);
		await settle();
		preloadSafeTexture("/old.webp");
		await settle();
		preloadSafeTexture("/new.webp");
		await settle();

		const dispose = (url: string) =>
			spyOn(textures.get(url) as Texture, "dispose");
		const disposeCardBack = dispose(CARD_BACK_URL);
		const disposeOld = dispose("/old.webp");
		const disposeNew = dispose("/new.webp");

		trimSafeTextureCache(2);
		expect(disposeCardBack).not.toHaveBeenCalled();
		expect(disposeOld).toHaveBeenCalledTimes(1);
		expect(disposeNew).not.toHaveBeenCalled();

		// Evicted means asked for again next time, not remembered as loaded.
		const loadsBefore = load.mock.calls.length;
		preloadSafeTexture("/old.webp");
		expect(load.mock.calls.length).toBe(loadsBefore + 1);
		await settle();
	});
});
