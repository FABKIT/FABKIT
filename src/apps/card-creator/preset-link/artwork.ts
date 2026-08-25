/**
 * Preset-Link Artwork Fetch
 *
 * `CardArtwork` is the one part of a preset link that isn't self-contained:
 * it carries an https URL to the card's artwork, which the card creator
 * fetches and hands to the store as a Blob, exactly as if the sender had
 * picked that file in the editor's upload field. An integrator that already
 * hosts the art (a card designer that hands the player off to FABKIT to
 * render it) can therefore open a finished card, rather than opening a card
 * whose only missing piece is an image the player has to find and re-upload.
 *
 * Everything here exists because the URL comes from whoever wrote the link,
 * and opening a link is not consent to fetch anything from anywhere:
 *   - https only. That rules out `file:`, `blob:` and `data:`, and plain
 *     `http:` with them — a page served over https would refuse an http
 *     image as mixed content anyway, so refusing it here just turns a
 *     browser-level block into a reason the sender can read.
 *   - The response must declare an `image/` content type, and SVG is
 *     refused: it is a document format, not a bitmap, and the renderer has
 *     no use for one it can't safely inline on export.
 *   - The download is capped in bytes and in time, so a broken or endless
 *     URL can't hang the open.
 *
 * Best-effort like the rest of the preset-link contract: every failure here
 * resolves to `null` and the card opens without artwork. Nothing in this
 * module throws.
 */

/** Beyond this the card opens without art rather than waiting longer — the
 * artwork is the one field a preset link can't resolve instantly, so it is
 * also the only one that can hold up the editor. */
const ARTWORK_FETCH_TIMEOUT_MS = 10_000;

/** Card art is one illustration: past this the sender has almost certainly
 * linked the wrong asset. Deliberately in the same range as the editor's own
 * upload field, so the two feel alike without either owning the other's
 * limit. */
const MAX_ARTWORK_BYTES = 10 * 1024 * 1024;

const ARTWORK_PROTOCOL = "https:";

/** `null` for anything that isn't an absolute https URL. */
function getArtworkUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    console.error(
      "[preset-link] CardArtwork: not an absolute URL. Dropping this field.",
      raw,
    );
    return null;
  }
  if (url.protocol !== ARTWORK_PROTOCOL) {
    console.error(
      `[preset-link] CardArtwork: ${url.protocol} URLs are not fetched — only https. Dropping this field.`,
    );
    return null;
  }
  return url;
}

/** True for any bitmap type the browser might decode. That is wider than the
 * editor's upload field offers, deliberately: what an `<img>` can render is
 * the real constraint, and a sender already hosting its art shouldn't have to
 * transcode it. SVG is excluded — see the module doc. */
function isRenderableImageType(contentType: string): boolean {
  const mimeType = contentType.split(";")[0].trim().toLowerCase();
  return mimeType.startsWith("image/") && mimeType !== "image/svg+xml";
}

/**
 * Fetches a preset link's `CardArtwork` URL to a Blob ready for
 * `setCardArtwork`.
 * `null` — never a throw — when the URL is unusable, unreachable, blocked by
 * the art host's CORS policy, not an image, too big, too slow, or when
 * `signal` aborts because the caller has stopped caring.
 */
export async function getPresetArtwork(
  raw: string | undefined,
  signal?: AbortSignal,
): Promise<Blob | null> {
  if (raw === undefined) return null;

  const url = getArtworkUrl(raw);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      // The art host is a third party the visitor never chose: no cookies,
      // no referrer, and CORS enforced (a host that hasn't opted in with
      // `access-control-allow-origin` simply doesn't serve art here).
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: signal
        ? AbortSignal.any([
            signal,
            AbortSignal.timeout(ARTWORK_FETCH_TIMEOUT_MS),
          ])
        : AbortSignal.timeout(ARTWORK_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[preset-link] CardArtwork: ${url.href} responded ${response.status}. Dropping this field.`,
      );
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!isRenderableImageType(contentType)) {
      console.error(
        `[preset-link] CardArtwork: ${url.href} is "${contentType}", not a bitmap image. Dropping this field.`,
      );
      return null;
    }

    // Declared length rejects an oversized body before it's downloaded; the
    // blob's own size is still checked, since a chunked response declares none.
    const declaredLength = Number(response.headers.get("content-length"));
    if (declaredLength > MAX_ARTWORK_BYTES) {
      console.error(
        `[preset-link] CardArtwork: ${url.href} declares ${declaredLength} bytes, over the limit. Dropping this field.`,
      );
      return null;
    }

    const blob = await response.blob();
    if (blob.size > MAX_ARTWORK_BYTES) {
      console.error(
        `[preset-link] CardArtwork: ${url.href} is ${blob.size} bytes, over the limit. Dropping this field.`,
      );
      return null;
    }

    return blob;
  } catch (error) {
    console.error(
      `[preset-link] CardArtwork: couldn't fetch ${url.href} (unreachable, CORS-blocked, cancelled, or timed out). Dropping this field.`,
      error,
    );
    return null;
  }
}
