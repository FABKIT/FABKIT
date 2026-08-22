/**
 * Fetches the image a prefill link's `art` param points at.
 *
 * Any https host is accepted, and the image is fetched to a Blob rather than
 * pointed at from the SVG. See
 * docs/adr/0003-prefill-link-artwork-has-no-host-allowlist.md for both
 * decisions and what they cost.
 */

/**
 * Ceiling on a fetched image. Generous enough for a print-resolution
 * illustration, low enough that a link cannot make a phone download a
 * gigabyte before anything is on screen.
 */
export const ARTWORK_MAX_BYTES = 32 * 1024 * 1024;

/**
 * How long a host gets before the card opens without its artwork. The route
 * loader awaits this fetch, so an unresponsive host would otherwise hold back
 * the whole page rather than one field.
 */
export const ARTWORK_TIMEOUT_MS = 10_000;

const OVERSIZE_MESSAGE = "Artwork is larger than the size ceiling";

/**
 * http is rejected rather than upgraded: the browser blocks it as mixed
 * content before the request starts, so accepting it would only turn a clear
 * "this param is not usable" into a fetch that always fails.
 */
export const getArtworkUrl = (value: string): string | null => {
	let url: string | null = null;

	try {
		const parsed = new URL(value);

		if (parsed.protocol === "https:") {
			url = parsed.href;
		}
	} catch {
		// Not a URL at all, which for our purposes is indistinguishable from a
		// URL we won't fetch.
	}

	return url;
};

/**
 * Content-Length is advisory: absent on a chunked response, and free to lie.
 * Reading the body in chunks drops an oversize image as soon as it crosses the
 * ceiling, instead of after the whole download has already landed.
 */
const getBoundedBlob = async (response: Response): Promise<Blob> => {
	if (response.body === null) {
		throw new Error("Artwork response had no body");
	}

	const reader = response.body.getReader();
	// A fetch body's chunks are never SharedArrayBuffer-backed, which is all
	// Blob's parameter type asks for and all the DOM types decline to say.
	const chunks: Uint8Array<ArrayBuffer>[] = [];
	let receivedBytes = 0;
	let isOversize = false;
	let isComplete = false;

	while (!isComplete && !isOversize) {
		const { done, value } = await reader.read();

		if (done) {
			isComplete = true;
		} else {
			receivedBytes += value.byteLength;
			isOversize = receivedBytes > ARTWORK_MAX_BYTES;

			if (!isOversize) {
				chunks.push(value as Uint8Array<ArrayBuffer>);
			}
		}
	}

	if (isOversize) {
		await reader.cancel();
		throw new Error(OVERSIZE_MESSAGE);
	}

	return new Blob(chunks, {
		type: response.headers.get("content-type") ?? "",
	});
};

/**
 * Throws on anything that stops us producing a usable image: a CORS-less host
 * (the opaque no-cors response's blob is unusable, so it is not a workaround),
 * a 404, an abort, a host that never answers, or an image past the size
 * ceiling. The caller turns that into a notice and opens the card without
 * artwork.
 */
export const getArtworkBlob = async (
	url: string,
	signal: AbortSignal,
): Promise<Blob> => {
	// The timeout covers the body as well as the headers, since aborting the
	// fetch errors the stream getBoundedBlob is reading.
	const response = await fetch(url, {
		signal: AbortSignal.any([signal, AbortSignal.timeout(ARTWORK_TIMEOUT_MS)]),
	});

	if (!response.ok) {
		throw new Error(`Artwork request failed with status ${response.status}`);
	}

	const declaredBytes = Number(response.headers.get("content-length"));
	if (declaredBytes > ARTWORK_MAX_BYTES) {
		await response.body?.cancel();
		throw new Error(OVERSIZE_MESSAGE);
	}

	return getBoundedBlob(response);
};
