/**
 * Prefill links: a URL that opens the card creator with fields already filled
 * in, built by an application outside FABKIT.
 *
 * This module is the boundary. Nothing outside url-params/ should reach past
 * it into the parser, the vocabulary, or the notice store.
 *
 * The order below is the part that is easy to get wrong. loadCard resets to
 * initial state and merges raw, running none of the side effects the store's
 * own setters do, so it must be called exactly once with everything parse.ts
 * resolved. Artwork can only follow it: setCardArtwork is async and seeds
 * CardArtPosition from the image's natural dimensions.
 */

import { v4 as uuid } from "uuid";
import { useCardCreator } from "../stores/card-creator.ts";
import { getArtworkBlob } from "./artwork.ts";
import { setPrefillNotice } from "./notice.ts";
import { parsePrefillParams } from "./parse.ts";
import { getCardTextHTML } from "./text.ts";
import type { IgnoredParam } from "./vocabulary.ts";

export {
	dismissPrefillNotice,
	dismissStalePrefillNotice,
	usePrefillNotice,
} from "./notice.ts";
export type { IgnoredParam } from "./vocabulary.ts";

export const applyPrefillParams = async (
	search: Record<string, unknown>,
	signal: AbortSignal,
): Promise<void> => {
	const ignored: IgnoredParam[] = [];

	try {
		const parsed = parsePrefillParams(search);
		ignored.push(...parsed.ignored);

		const text =
			parsed.textDoc === null
				? {}
				: {
						CardTextNode: parsed.textDoc,
						CardTextHTML: getCardTextHTML(parsed.textDoc),
					};

		// A link produces a card the gallery has never seen, so it needs its own
		// __version. loadCard merges over the store's initial state, whose
		// __version is minted once when the module loads and is therefore the id
		// of whatever was saved earlier in this page's life; inheriting it would
		// make the next Save update that row instead of adding one. reset() mints
		// a fresh id for the same reason.
		useCardCreator
			.getState()
			.loadCard({ ...parsed.patch, ...text, __version: uuid() });

		if (parsed.artworkUrl !== null) {
			try {
				const artwork = await getArtworkBlob(parsed.artworkUrl, signal);
				await useCardCreator.getState().setCardArtwork(artwork);
			} catch {
				// The host being unreachable, slow, or CORS-less is the common case
				// and says nothing about the rest of the link, so the card still
				// opens with everything else applied.
				ignored.push({ param: "art", reason: "artwork_unavailable" });
			}
		}
	} catch (error) {
		// Anything reaching here is a fault in this code rather than a bad link:
		// the parser is pure, and the only other step is serialising a document
		// we built ourselves. It must not escape, because the caller strips the
		// params immediately after this and would never get the chance, leaving
		// them in the URL to be applied again on every later loader run.
		console.error("Prefill link could not be applied", error);
	}

	setPrefillNotice(ignored);
};
