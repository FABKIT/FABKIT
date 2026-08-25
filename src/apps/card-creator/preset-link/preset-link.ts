/**
 * Card Preset Links
 *
 * Lets an external tool open FABKIT's card-creator pre-filled with a
 * specific card, via `/#/preset?link=<url-encoded JSON>`. This is the
 * versioned contract external integrators build against — see the field
 * contract below for the full field
 * list.
 *
 * The `#/` is not a typo: FABKIT uses hash-based routing
 * (`createHashHistory` in platform/router.tsx), so the route path and its
 * search params both live after the `#`, not in the "real" URL path/query
 * a server would see. `validateSearch`/`loaderDeps` on the `/preset` route
 * handle this transparently — nothing in this module cares — but it does
 * mean the whole `link=...` payload sits inside the fragment already,
 * before it even reaches the `?`.
 *
 * Design constraints (see the plan this was built from for the full
 * rationale):
 *   - Self-contained: the whole payload lives in the URL, no backend.
 *     `CardBack`/`CardBackRight` only resolve against the static,
 *     checked-in stock manifest (resolve.ts) — custom (image-URL-based)
 *     card backs are out of scope for preset links, use the interactive
 *     upload dialog in the editor instead. `CardArtwork` is the single
 *     exception to "no network fetch": it names an image the card creator
 *     downloads on open, under the guards in artwork.ts.
 *   - CardText is restricted markup (see utils/preset-text.ts), not HTML or
 *     Tiptap JSON — an integrator never needs to know FABKIT's editor
 *     internals to write rules text.
 *   - Best-effort: an invalid field or an unreachable image URL is dropped
 *     silently rather than blocking the load — a partially-wrong
 *     integrator URL still opens something usable. Every field below is
 *     validated with Valibot and wrapped in `v.fallback(schema, ...)`, so a
 *     bad value for one field never fails the rest of the payload — see
 *     "Wire schema" below. There's no version field: a preset-link payload
 *     is never stored (unlike a saved card in persistence/), so there's
 *     nothing to migrate — every sender builds one fresh, and an unrecognised
 *     field is always just dropped rather than versioned around.
 *   - Opening a preset link always starts a brand-new, unsaved card — it
 *     never merges into whatever's currently open. This falls out of
 *     `loadCard`'s existing reset-then-overlay semantics for free.
 *
 * ─── Example payload ───────────────────────────────────────────────────────
 *
 * ```json
 * {
 *   "CardType": "action",
 *   "CardName": "Rolling Thunder",
 *   "CardPitch": 2,
 *   "CardResource": "1",
 *   "CardPower": "3",
 *   "CardDefense": "3",
 *   "CardClass": "ranger",
 *   "CardTalent": "lightning",
 *   "CardRarity": "rare",
 *   "CardText": "Whenever you hit a hero with an arrow attack action card this turn, they get **Dominate**.\n\n:power: Go again.",
 *   "CardBack": { "id": 12 },
 *   "CardArtwork": "https://fabkit.io/img/fabble/standardmode.webp"
 * }
 * ```
 * URL: `/#/preset?link=` + `encodeURIComponent(JSON.stringify(payload))`
 *
 * ─── Field contract ────────────────────────────────────────────────────────
 *
 * All fields are optional — anything omitted or invalid falls back to
 * card-creator's normal defaults (see `loadCard` in stores/card-creator.ts).
 *
 *   CardType            one of the keys of CardTypes (shared/config/cards/types.ts)
 *   CardPitch           1 | 2 | 3
 *   CardName            string
 *   CardResource        string
 *   CardPower           string
 *   CardText            restricted markup — see utils/preset-text.ts
 *   CardTalent          one of the keys of CardTalents
 *   CardClass           one of the keys of CardClasses
 *   CardSecondaryClass  one of the keys of CardClasses
 *   CardSubType         string
 *   CardRarity          one of the keys of CardRarities
 *   CardDefense         string
 *   CardLife            string
 *   CardHeroIntellect   string
 *   CardWeapon          "(1H)" | "(2H)"
 *   CardMacroGroup      string
 *   CardSetNumber       string
 *   CardArtwork         https URL to the card's artwork — fetched on
 *                       open, see artwork.ts
 *   CardArtworkCredits  string
 *   CardBackStyle       "dented" | "flat"
 *   CardBackSplit       number, 0.02..0.98 (hybrid seam position)
 *   CardBackBlend       number, 0..1 (hybrid seam softness)
 *   CardBack            { id } — a stock card-back id (see resolve.ts)
 *   CardBackRight       same shape as CardBack (right half of a hybrid frame)
 *   meldActiveHalf      "A" | "B"
 *   meldHalfA/B         { CardType, CardName, CardClass, CardSecondaryClass,
 *                         CardSubType, CardTalent, CardText, CardMacroGroup,
 *                         CardWeapon }
 *
 * `CardArtwork` is a URL here rather than the image itself, and it is the
 * only artwork field: `CardArtPosition` is out of scope (the fetched image
 * is fitted to the frame's open area, see artwork-fit.ts, and dragged from
 * there in the editor), as is a meld half's own artwork — a meld card takes
 * its art per half, so `CardArtwork` is dropped rather than fetched for one. `CardOverlay`/`CardOverlayOpacity` are out of
 * scope too — they're a dev-only debug overlay (gated behind
 * `import.meta.env.DEV` in the editor itself), never a real card-creation
 * field. Custom card backs are likewise out: `CardBack`/`CardBackRight`
 * only accept a stock id (see resolve.ts) — set a custom frame
 * interactively in the editor after opening the preset.
 */

import { trackEvent } from "@fabkit/platform/analytics";
import { CardStyles } from "@fabkit/shared/config/cards/card_styles.ts";
import {
	type CardClass,
	CardClasses,
} from "@fabkit/shared/config/cards/classes.ts";
import {
	CardRarities,
	type CardRarity,
} from "@fabkit/shared/config/cards/rarities.ts";
import {
	type CardTalent,
	CardTalents,
} from "@fabkit/shared/config/cards/talents.ts";
import { type CardType, CardTypes } from "@fabkit/shared/config/cards/types.ts";
import * as v from "valibot";
import {
	type CardCreatorState,
	defaultMeldHalf,
	type MeldHalf,
	useCardCreator,
} from "../stores/card-creator.ts";
import { parsePresetText } from "../utils/preset-text.ts";
import { getPresetArtwork } from "./artwork.ts";
import { getPresetArtworkRect } from "./artwork-fit.ts";
import { resolveCardBack } from "./resolve.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ─── Wire schema ──────────────────────────────────────────────────────────
// Every leaf is wrapped in `v.fallback(schema, ...)`: a missing or
// malformed value for that one field silently falls back rather than
// failing the whole payload — the same best-effort contract the module doc
// above describes, now enforced by Valibot instead of hand-rolled guards.

const optionalString = () => v.fallback(v.optional(v.string()), undefined);
const optionalNumber = () =>
	v.fallback(v.optional(v.pipe(v.number(), v.finite())), undefined);
const optionalPicklist = <const T extends readonly (string | number)[]>(
	options: T,
) => v.fallback(v.optional(v.picklist(options)), undefined);

const CARD_TYPE_KEYS = Object.keys(CardTypes) as CardType[];
const CARD_CLASS_KEYS = Object.keys(CardClasses) as CardClass[];
const CARD_TALENT_KEYS = Object.keys(CardTalents) as CardTalent[];
const CARD_RARITY_KEYS = Object.keys(CardRarities) as CardRarity[];
const CARD_WEAPON_VALUES = ["(1H)", "(2H)"] as const;

/** `PresetCardBackRef` from resolve.ts, inferred rather than hand-typed. */
const CardBackRefSchema = v.fallback(
	v.nullable(v.object({ id: v.pipe(v.number(), v.finite()) })),
	null,
);

const MeldHalfSchema = v.object({
	CardType: optionalPicklist(CARD_TYPE_KEYS),
	CardName: optionalString(),
	CardClass: optionalPicklist(CARD_CLASS_KEYS),
	CardSecondaryClass: optionalPicklist(CARD_CLASS_KEYS),
	CardSubType: optionalString(),
	CardTalent: optionalPicklist(CARD_TALENT_KEYS),
	CardText: optionalString(),
	CardMacroGroup: optionalString(),
	CardWeapon: optionalPicklist(CARD_WEAPON_VALUES),
});

/** Substituted whenever `meldHalfA`/`meldHalfB` is missing or not an object. */
const EMPTY_MELD_HALF: v.InferOutput<typeof MeldHalfSchema> = {
	CardType: undefined,
	CardName: undefined,
	CardClass: undefined,
	CardSecondaryClass: undefined,
	CardSubType: undefined,
	CardTalent: undefined,
	CardText: undefined,
	CardMacroGroup: undefined,
	CardWeapon: undefined,
};
const MeldHalfRefSchema = v.fallback(MeldHalfSchema, EMPTY_MELD_HALF);

/** The flat, 1:1-with-`CardCreatorState` fields — everything that isn't a
 * transform (CardText), a manifest lookup (CardBack/CardBackRight), or a
 * nested object (meldHalfA/meldHalfB), which are parsed separately below. */
const PresetStateSchema = v.object({
	CardType: optionalPicklist(CARD_TYPE_KEYS),
	CardPitch: optionalPicklist([1, 2, 3] as const),
	CardName: optionalString(),
	CardResource: optionalString(),
	CardPower: optionalString(),
	CardTalent: optionalPicklist(CARD_TALENT_KEYS),
	CardClass: optionalPicklist(CARD_CLASS_KEYS),
	CardSecondaryClass: optionalPicklist(CARD_CLASS_KEYS),
	CardSubType: optionalString(),
	CardRarity: optionalPicklist(CARD_RARITY_KEYS),
	CardDefense: optionalString(),
	CardLife: optionalString(),
	CardHeroIntellect: optionalString(),
	CardWeapon: optionalPicklist(CARD_WEAPON_VALUES),
	CardMacroGroup: optionalString(),
	CardSetNumber: optionalString(),
	CardArtworkCredits: optionalString(),
	CardBackStyle: optionalPicklist(CardStyles),
	CardBackSplit: optionalNumber(),
	CardBackBlend: optionalNumber(),
	meldActiveHalf: optionalPicklist(["A", "B"] as const),
});

/** Drops every key whose value is `undefined`, so spreading the result onto
 * a default object (e.g. `{ ...initialState, ...partial }`) can't clobber a
 * real default with an explicit `undefined`. */
function definedEntries<T extends Record<string, unknown>>(obj: T): Partial<T> {
	const out: Partial<T> = {};
	for (const key of Object.keys(obj) as (keyof T)[]) {
		if (obj[key] !== undefined) out[key] = obj[key];
	}
	return out;
}

function buildMeldHalf(
	parsed: v.InferOutput<typeof MeldHalfSchema>,
): Partial<MeldHalf> {
	const { CardText, ...rest } = parsed;
	const half: Partial<MeldHalf> = definedEntries(rest);
	if (CardText !== undefined) {
		const { html, content } = parsePresetText(CardText);
		half.CardTextHTML = html;
		half.CardTextNode = content;
	}
	return half;
}

/**
 * Parses and applies a preset-link payload (the JSON decoded from the
 * `link` search param on `/preset`) to the card-creator store, opening a
 * brand-new card. Never throws — an invalid payload is a silent no-op, and
 * an invalid individual field is simply omitted, per the feature's
 * best-effort error handling.
 *
 * The card itself is applied synchronously, before this ever awaits; the
 * returned promise only covers `CardArtwork`, whose image has to be
 * fetched (see artwork.ts). A caller that awaits it hands the editor a card
 * complete with artwork; one that doesn't still gets every other field
 * immediately. `signal` is how a caller that stops waiting — the route's
 * own abort controller, when the user navigates away mid-fetch — keeps a
 * late-arriving image off whatever card they opened instead.
 */
export async function loadPresetLink(
	raw: unknown,
	signal?: AbortSignal,
): Promise<void> {
	if (!isRecord(raw)) {
		console.error(
			"[preset-link] Ignoring preset link: payload is not a JSON object.",
			raw,
		);
		return;
	}

	// `raw` is already known to be a plain object, so this can't fail —
	// every field's own fallback absorbs the rest.
	const flat = v.parse(PresetStateSchema, raw);
	const partial: Partial<CardCreatorState> = definedEntries(flat);

	const text = v.parse(optionalString(), raw.CardText);
	if (text !== undefined) {
		const { html, content } = parsePresetText(text);
		partial.CardTextHTML = html;
		partial.CardTextNode = content;
	}

	const cardBack = resolveCardBack(v.parse(CardBackRefSchema, raw.CardBack));
	const cardBackRight = resolveCardBack(
		v.parse(CardBackRefSchema, raw.CardBackRight),
	);
	const meldHalfA = buildMeldHalf(v.parse(MeldHalfRefSchema, raw.meldHalfA));
	const meldHalfB = buildMeldHalf(v.parse(MeldHalfRefSchema, raw.meldHalfB));

	if (cardBack) partial.CardBack = cardBack;
	if (cardBackRight) partial.CardBackRight = cardBackRight;
	if (Object.keys(meldHalfA).length > 0) {
		partial.meldHalfA = { ...defaultMeldHalf, ...meldHalfA };
	}
	if (Object.keys(meldHalfB).length > 0) {
		partial.meldHalfB = { ...defaultMeldHalf, ...meldHalfB };
	}

	// A meld card's art belongs to its halves, which the wire format doesn't
	// carry: fetching here would spend the wait on an image no meld field
	// shows and no meld control can clear.
	const artworkUrl =
		partial.CardType === "meld"
			? undefined
			: v.parse(optionalString(), raw.CardArtwork);

	if (Object.keys(partial).length === 0 && artworkUrl === undefined) {
		console.error(
			"[preset-link] Preset payload parsed, but none of its fields were recognized/valid — opening a default card. Sent keys:",
			Object.keys(raw),
		);
	}

	useCardCreator.getState().loadCard(partial);

	const artwork = await getPresetArtwork(artworkUrl, signal);
	if (artwork && !signal?.aborted) {
		try {
			await useCardCreator.getState().setCardArtwork(artwork);
			await fitArtworkToFrame(signal);
		} catch (error) {
			console.error(
				"[preset-link] CardArtwork: the fetched image couldn't be decoded. Opening the card without artwork.",
				error,
			);
		}
	}

	if (partial.CardType) {
		trackEvent({
			name: "preset_link_opened",
			data: { cardType: partial.CardType },
		});
	}
}

/**
 * Replaces the store's natural-size placement with one that fills the frame
 * (see artwork-fit.ts). Reads the artwork's measured size back out of
 * `CardArtPosition`, which `setCardArtwork` has just filled in, rather than
 * decoding the image a second time.
 */
async function fitArtworkToFrame(
	signal: AbortSignal | undefined,
): Promise<void> {
	const card = useCardCreator.getState();
	if (!card.CardArtPosition) return;

	const rect = await getPresetArtworkRect(card, card.CardArtPosition);
	if (rect && !signal?.aborted) {
		useCardCreator.getState().setCardArtPosition(rect);
	}
}
