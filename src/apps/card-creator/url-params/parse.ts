/**
 * Turns the query of a prefill link into a single patch for loadCard, plus
 * the list of params that could not be applied.
 *
 * Pure and browser-free on purpose, so the whole vocabulary is testable
 * without a DOM. The two steps that need a browser (serialising the card text
 * to HTML, and fetching the artwork) happen in index.ts, after this.
 */

import {
	getCardBacksForTypeAndStyle,
	getSuggestedCardBack,
} from "@fabkit/shared/config/cards/card_backs.ts";
import {
	type CardStyle,
	CardStyles,
} from "@fabkit/shared/config/cards/card_styles.ts";
import type { CardType } from "@fabkit/shared/config/cards/types.ts";
import type { JSONContent } from "@tiptap/core";
import { isFieldVisible } from "../components/utils.ts";
import type { CardCreatorCardBack } from "../config/rendering.ts";
import type { CardCreatorState } from "../stores/card-creator.ts";
import { getArtworkUrl } from "./artwork.ts";
import { getCardTextDoc } from "./text.ts";
import {
	FieldParams,
	getCardStyleParam,
	getCardTypeParam,
	type IgnoredParam,
	PrefillParamNames,
} from "./vocabulary.ts";

/** What a link with no type or style param opens as. */
const DefaultCardType: CardType = "action";
const DefaultCardStyle: CardStyle = "dented";

export interface PrefillParseResult {
	/**
	 * Everything the link sets that this module can resolve on its own. It goes
	 * into a single loadCard call, which resets to initial state before merging,
	 * so nothing may be applied through a second one.
	 */
	patch: Partial<CardCreatorState>;
	/**
	 * Card text as a Tiptap document. Kept out of the patch because its HTML
	 * counterpart needs a DOM to generate. The caller adds both fields at once,
	 * and both are required: CardTextNode alone leaves the renderers blank
	 * until the first keystroke, since only a user edit writes CardTextHTML.
	 */
	textDoc: JSONContent | null;
	/** Fetched by the caller, since loadCard cannot carry a Blob it doesn't have. */
	artworkUrl: string | null;
	ignored: IgnoredParam[];
}

/**
 * Stock frames only. Custom frames are user-uploaded rows whose ids and names
 * mean nothing on another device, so a public link resolving against one would
 * pick up whatever the recipient happened to upload under that name. Reading
 * the manifest directly rather than filtering getAvailableCardBacks makes that
 * structural instead of a filter a later edit could drop.
 */
const getStockCardBacks = (
	cardType: CardType,
	style: CardStyle,
): CardCreatorCardBack[] =>
	getCardBacksForTypeAndStyle(cardType, style) as CardCreatorCardBack[];

/**
 * Search values reach us already parsed by the router, so a numeric-looking
 * value arrives as a number and a JSON-looking one as an object. Everything
 * this vocabulary accepts is expressible as a non-empty string; anything else
 * is reported rather than coerced into "[object Object]".
 */
const getParamValues = (
	search: Record<string, unknown>,
	ignored: IgnoredParam[],
): Map<string, string> => {
	const values = new Map<string, string>();

	for (const [param, raw] of Object.entries(search)) {
		if (!PrefillParamNames.has(param)) {
			ignored.push({ param, reason: "unknown_param" });
		} else {
			const isTextual =
				typeof raw === "string" ||
				typeof raw === "number" ||
				typeof raw === "boolean";
			const value = isTextual ? String(raw).trim() : "";

			if (value === "") {
				ignored.push({ param, reason: "invalid_value" });
			} else {
				values.set(param, value);
			}
		}
	}

	return values;
};

const getFrameByName = (
	name: string | undefined,
	param: string,
	available: CardCreatorCardBack[],
	ignored: IgnoredParam[],
): CardCreatorCardBack | null => {
	let frame: CardCreatorCardBack | null = null;

	if (name !== undefined) {
		const wanted = name.toLowerCase();
		frame =
			available.find((back) => back.name.toLowerCase() === wanted) ?? null;

		if (frame === null) {
			ignored.push({ param, reason: "unknown_frame" });
		}
	}

	return frame;
};

interface FrameSelection {
	style: CardStyle;
	back: CardCreatorCardBack | null;
	backRight: CardCreatorCardBack | null;
	/**
	 * Whether the link asked for a second frame at all, which is not the same
	 * as getting one: a name that did not resolve leaves backRight null.
	 */
	isSecondFrameRequested: boolean;
}

/**
 * Resolves both halves of the frame the way setCardType would, which loadCard
 * cannot do for itself: it is a raw merge with no side effects, so without
 * this a `type=hero` link would keep the initial state's action frame.
 *
 * CardBackRight stays null unless frame2 resolved. That null is the whole of
 * what makes a card hybrid, so a link cannot express a hybrid without one.
 */
const getFrames = (
	values: Map<string, string>,
	cardType: CardType,
	requestedStyle: CardStyle,
	isStyleRequested: boolean,
	ignored: IgnoredParam[],
): FrameSelection => {
	let style = requestedStyle;
	let available = getStockCardBacks(cardType, style);

	// Four type/style combinations have no frames at all. setCardType falls back
	// to a style that does rather than leaving the card unrenderable, so a link
	// asking for one of them lands where the form's own type picker would.
	if (available.length === 0) {
		for (const fallbackStyle of CardStyles) {
			const fallbackAvailable = getStockCardBacks(cardType, fallbackStyle);

			if (fallbackAvailable.length > 0) {
				style = fallbackStyle;
				available = fallbackAvailable;
				break;
			}
		}
	}

	// Only worth reporting when the link asked for the style it did not get.
	// Falling back from an unrequested default is not something the author did.
	if (isStyleRequested && style !== requestedStyle) {
		ignored.push({ param: "style", reason: "style_unavailable" });
	}

	const named = getFrameByName(
		values.get("frame"),
		"frame",
		available,
		ignored,
	);

	const secondFrame = values.get("frame2");

	return {
		style,
		back:
			named ?? (getSuggestedCardBack(available) as CardCreatorCardBack | null),
		backRight: getFrameByName(secondFrame, "frame2", available, ignored),
		isSecondFrameRequested: secondFrame !== undefined,
	};
};

export const parsePrefillParams = (
	search: Record<string, unknown>,
): PrefillParseResult => {
	const ignored: IgnoredParam[] = [];
	const values = getParamValues(search, ignored);

	let cardType: CardType = DefaultCardType;
	const requestedType = values.get("type");
	if (requestedType !== undefined) {
		const parsed = getCardTypeParam(requestedType);

		if (parsed === undefined) {
			ignored.push({ param: "type", reason: "invalid_value" });
		} else {
			cardType = parsed;
		}
	}

	let cardStyle: CardStyle = DefaultCardStyle;
	let isStyleRequested = false;
	const requestedStyle = values.get("style");
	if (requestedStyle !== undefined) {
		const parsed = getCardStyleParam(requestedStyle);

		if (parsed === undefined) {
			ignored.push({ param: "style", reason: "invalid_value" });
		} else {
			cardStyle = parsed;
			isStyleRequested = true;
		}
	}

	const frames = getFrames(
		values,
		cardType,
		cardStyle,
		isStyleRequested,
		ignored,
	);
	const patch: Partial<CardCreatorState> = {
		CardType: cardType,
		CardBackStyle: frames.style,
		CardBack: frames.back,
		CardBackRight: frames.backRight,
	};

	for (const [param, field] of Object.entries(FieldParams)) {
		const value = values.get(param);

		if (value !== undefined) {
			if (
				field.formField !== null &&
				!isFieldVisible(field.formField, cardType)
			) {
				ignored.push({ param, reason: "not_on_card_type" });
			} else if (field.requiresSecondFrame && frames.backRight === null) {
				// A frame2 that did not resolve has already been reported, and
				// fixing that name is what makes these usable, so a second line
				// about the same cause would send the author looking for a param
				// their link already has.
				if (!frames.isSecondFrameRequested) {
					ignored.push({ param, reason: "needs_second_frame" });
				}
			} else if (!field.applyTo(patch, value)) {
				ignored.push({ param, reason: "invalid_value" });
			}
		}
	}

	let textDoc: JSONContent | null = null;
	const text = values.get("text");
	if (text !== undefined) {
		if (isFieldVisible("CardText", cardType)) {
			textDoc = getCardTextDoc(text);
		} else {
			ignored.push({ param: "text", reason: "not_on_card_type" });
		}
	}

	let artworkUrl: string | null = null;
	const art = values.get("art");
	if (art !== undefined) {
		artworkUrl = getArtworkUrl(art);

		if (artworkUrl === null) {
			ignored.push({ param: "art", reason: "invalid_value" });
		}
	}

	return { patch, textDoc, artworkUrl, ignored };
};
