/**
 * Merges stock (manifest) card backs with custom (user-uploaded) frames, and
 * provides the missing-frame placeholder machinery that keeps a card's
 * reference to a deleted/not-yet-imported custom frame from being silently
 * destroyed by a routine save.
 *
 * Deliberately NOT in src/shared/ — shared/ must not know about IndexedDB or
 * the custom-frames registry (root CLAUDE.md's layering rule: shared has no
 * platform/app deps). src/shared/config/cards/card_backs.ts's
 * getCardBacksForTypeAndStyle stays pure and untouched; this module composes
 * it with the app-level custom-frames registry.
 */

import {
	getCardBacksForTypeAndStyle,
	getSuggestedCardBack,
} from "@fabkit/shared/config/cards/card_backs.ts";
import type { CardStyle } from "@fabkit/shared/config/cards/card_styles.ts";
import type { CardType } from "@fabkit/shared/config/cards/types.ts";
import { getCustomFramesForTypeAndStyle } from "../stores/custom-frames.ts";
import type { CardCreatorCardBack } from "./rendering.ts";

/**
 * Stock-then-custom merged list of card backs available for a given card
 * type + style. Stock first, so getSuggestedCardBack's `available[0]`
 * fallback default stays a stock frame rather than an arbitrary custom one.
 *
 * Takes `customFrames` explicitly (not read internally from the registry) —
 * see getCustomFramesForTypeAndStyle's doc comment for why: a zero-argument
 * call reading external mutable state looks pure to React Compiler's
 * auto-memoization and can get silently frozen across renders. Callers
 * inside React should pass `useCustomFrames()`; the card-creator store's own
 * actions (outside React) should pass `getCustomFramesSnapshot()`.
 */
export function getAvailableCardBacks(
	customFrames: CardCreatorCardBack[],
	type: CardType | null,
	style: CardStyle,
): CardCreatorCardBack[] {
	return [
		...(getCardBacksForTypeAndStyle(type, style) as CardCreatorCardBack[]),
		...getCustomFramesForTypeAndStyle(customFrames, type, style),
	];
}

/**
 * Derives presentational fields (type/dented/renderer) for a missing-frame
 * placeholder from the card's own CardType + CardBackStyle, since
 * SerializedCardState doesn't persist a custom frame's type/dented/renderer
 * separately from its id.
 *
 * getCardBacksForTypeAndStyle returns an EMPTY list for four combinations
 * (event/dented, event/flat, weapon/flat, weapon_equipment/flat), and
 * getSuggestedCardBack returns null on an empty list — so derivation can
 * legitimately fail. A placeholder must NEVER end up with an unset renderer:
 * Renderer.tsx resolves `AllRenderConfigVariations[CardBack?.renderer]`, and
 * an unset/unresolvable renderer means the card renders NOTHING at all, not
 * even the placeholder image. Hence the hard defaults below, which are
 * guaranteed keys in AllRenderConfigVariations.
 */
export function derivePlaceholderPresentation(
	cardType: CardType | null,
	style: CardStyle,
): {
	type: string;
	dented: boolean;
	renderer: CardCreatorCardBack["renderer"];
} {
	const nearest = getSuggestedCardBack(
		getCardBacksForTypeAndStyle(cardType, style),
	) as CardCreatorCardBack | null;
	const dented = style === "dented";
	return {
		type: nearest?.type ?? "general",
		dented: nearest?.dented ?? dented,
		renderer: nearest?.renderer ?? (dented ? "normal_dented" : "normal_flat"),
	};
}

/**
 * Stand-in for a custom frame that couldn't be resolved locally (deleted,
 * not yet imported, cross-tab race, etc). Critically, this PRESERVES THE
 * ORIGINAL ID — serializeCardState reads `state.CardBack?.id`, so the
 * negative id round-trips through a save untouched instead of being replaced
 * by a stock frame's positive id. Re-importing the missing frame later
 * silently restores the card; nothing is destroyed by loading, displaying,
 * or even saving a card in this state.
 */
/**
 * NOT user-facing prose — this module has no access to a translation
 * function (it's called from persistence/store code, far from React), so
 * this is a stable technical identifier only. Any UI that displays a
 * CardBack's `name` MUST check `missing === true` first and render
 * `t("card_creator.missing_frame_label")` (see CardBackField.tsx) instead of
 * this raw value — per CLAUDE.md's "no hardcoded strings" rule.
 */
const MISSING_FRAME_NAME = "missing-custom-frame";

export function makeMissingFramePlaceholder(
	id: number,
	cardType: CardType | null,
	style: CardStyle,
): CardCreatorCardBack {
	return {
		id, // preserved verbatim — this is the whole point
		name: MISSING_FRAME_NAME,
		source: "custom",
		missing: true,
		...derivePlaceholderPresentation(cardType, style),
		images: [{ id: 0, pitch: 0, fileName: "missing-frame.png" }],
	};
}

/**
 * `missing === true` is STICKY. A placeholder's negative id is, by
 * definition, absent from getAvailableCardBacks (the frame isn't present
 * locally — that's why it's a placeholder), so a plain "is this id still
 * valid" check would evict it, and the next save would silently write a
 * stock id in its place — the same data loss the placeholder exists to
 * prevent, just relocated from load time to the next type/style change.
 *
 * Every store action that might replace CardBack/CardBackRight must call
 * this FIRST, before any validity check or getSuggestedCardBack call — those
 * would happily return a stock frame and the reference would be gone.
 */
export function carryMissingFrame(
	frame: CardCreatorCardBack | null,
	cardType: CardType | null,
	style: CardStyle,
): CardCreatorCardBack | null {
	if (!frame?.missing) return null;
	return makeMissingFramePlaceholder(frame.id, cardType, style);
}

/**
 * Wraps carryMissingFrame so the ordering it requires (missing-check BEFORE
 * any validity check or suggestion) can't be dropped by a future call site.
 * `computeIfNotMissing` is only ever invoked when `current` isn't a sticky
 * placeholder — every store action that replaces CardBack/CardBackRight
 * should go through this rather than inlining `carryMissingFrame(...) ?? ...`
 * itself, so there's exactly one place the correct order lives.
 */
export function resolveCardBackKeepingMissing(
	current: CardCreatorCardBack | null,
	cardType: CardType | null,
	style: CardStyle,
	computeIfNotMissing: () => CardCreatorCardBack | null,
): CardCreatorCardBack | null {
	return carryMissingFrame(current, cardType, style) ?? computeIfNotMissing();
}
