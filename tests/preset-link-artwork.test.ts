import { afterEach, describe, expect, it } from "bun:test";
import { getPresetArtwork } from "../src/apps/card-creator/preset-link/artwork.ts";

const originalFetch = globalThis.fetch;

interface FetchCall {
	url: string;
	init: RequestInit | undefined;
}

const calls: FetchCall[] = [];

/** Replaces global fetch with one that records its call and answers with
 * `response`, so each test asserts on what was requested as well as what
 * came back. A response of `null` makes the fetch reject, standing in for an
 * unreachable host, a CORS refusal, or the abort signal firing — the browser
 * reports all three the same way.
 *
 * The URLs below are FABKIT's own hosted images, which really do answer
 * `image/webp` with `access-control-allow-origin: *` — so they double as a
 * worked example of a URL this feature accepts. Nothing here reaches the
 * network, though: a unit test that fetched for real would fail offline and
 * couldn't exercise the 404, oversize or timeout paths at all. */
function stubFetch(response: Response | null): void {
	calls.length = 0;
	globalThis.fetch = ((url: string | URL, init?: RequestInit) => {
		calls.push({ url: String(url), init });
		return response
			? Promise.resolve(response)
			: Promise.reject(new TypeError("Failed to fetch"));
	}) as typeof fetch;
}

function imageResponse(
	body: Blob,
	contentType = "image/jpeg",
	headers: Record<string, string> = {},
): Response {
	return new Response(body, {
		headers: { "content-type": contentType, ...headers },
	});
}

const artworkBlob = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], {
	type: "image/jpeg",
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("getPresetArtwork", () => {
	it("fetches an https URL and returns the image blob", async () => {
		stubFetch(imageResponse(artworkBlob));

		const artwork = await getPresetArtwork(
			"https://fabkit.io/img/fabble/standardmode.webp",
		);

		expect(artwork).not.toBeNull();
		expect(artwork?.size).toBe(artworkBlob.size);
		expect(calls[0].url).toBe("https://fabkit.io/img/fabble/standardmode.webp");
	});

	it("tells the art host nothing about the visitor beyond the request", async () => {
		stubFetch(imageResponse(artworkBlob));

		await getPresetArtwork("https://fabkit.io/img/fabble/chaosmode.webp");

		expect(calls[0].init?.credentials).toBe("omit");
		expect(calls[0].init?.referrerPolicy).toBe("no-referrer");
		expect(calls[0].init?.mode).toBe("cors");
		expect(calls[0].init?.signal).toBeDefined();
	});

	it("is a no-op when the payload carries no CardArtwork", async () => {
		stubFetch(imageResponse(artworkBlob));

		expect(await getPresetArtwork(undefined)).toBeNull();
		expect(calls).toHaveLength(0);
	});

	it("never fetches anything but an absolute https URL", async () => {
		stubFetch(imageResponse(artworkBlob));

		expect(
			await getPresetArtwork("http://fabkit.io/img/fabble/standardmode.webp"),
		).toBe(null);
		expect(await getPresetArtwork("data:image/png;base64,iVBORw0KGgo=")).toBe(
			null,
		);
		expect(await getPresetArtwork("file:///etc/passwd")).toBeNull();
		expect(await getPresetArtwork("javascript:alert(1)")).toBeNull();
		expect(await getPresetArtwork("/relative/art.png")).toBeNull();
		expect(calls).toHaveLength(0);
	});

	it("drops a response that isn't a bitmap image", async () => {
		stubFetch(imageResponse(artworkBlob, "text/html"));
		expect(
			await getPresetArtwork("https://fabkit.io/img/fabble/standardmode.webp"),
		).toBeNull();

		stubFetch(imageResponse(artworkBlob, "image/svg+xml"));
		expect(
			await getPresetArtwork("https://fabkit.io/img/fabble/FabbleLogo.svg"),
		).toBeNull();
	});

	it("accepts a content type that carries parameters", async () => {
		stubFetch(imageResponse(artworkBlob, "image/jpeg; charset=binary"));

		expect(
			await getPresetArtwork("https://fabkit.io/img/fabble/chaosmode.webp"),
		).not.toBe(null);
	});

	it("drops an error response", async () => {
		stubFetch(new Response("nope", { status: 404 }));

		expect(
			await getPresetArtwork(
				"https://fabkit.io/img/fabble/does-not-exist.webp",
			),
		).toBe(null);
	});

	it("drops a body that declares more bytes than the limit", async () => {
		stubFetch(
			imageResponse(artworkBlob, "image/jpeg", {
				"content-length": String(64 * 1024 * 1024),
			}),
		);

		expect(
			await getPresetArtwork("https://fabkit.io/img/fabble/chaosmode.webp"),
		).toBeNull();
	});

	it("drops an oversized body that declared no length", async () => {
		const oversized = new Blob([new Uint8Array(11 * 1024 * 1024)], {
			type: "image/jpeg",
		});
		stubFetch(imageResponse(oversized));

		expect(
			await getPresetArtwork("https://fabkit.io/img/fabble/chaosmode.webp"),
		).toBeNull();
	});

	it("drops an unreachable or CORS-blocked host rather than throwing", async () => {
		stubFetch(null);

		expect(
			await getPresetArtwork("https://fabkit.io/img/fabble/chaosmode.webp"),
		).toBeNull();
	});
});
