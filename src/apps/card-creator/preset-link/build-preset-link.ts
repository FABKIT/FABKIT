/**
 * Card Preset Links — Outgoing (Share)
 *
 * The other direction of preset-link.ts: turns the card-creator store's
 * *current* state into a preset-link payload/URL, for the "Share" button.
 * Best-effort in the same spirit as the reader — a field that can't be
 * represented in the wire format is simply omitted from the link rather
 * than blocking the share, since a partial link a recipient can still open
 * beats no link at all.
 *
 * Two things can't round-trip and are silently dropped here:
 *   - CardArtwork/CardArtPosition, CardOverlay/CardOverlayOpacity, and a
 *     custom (non-stock) CardBack/CardBackRight — all out of scope for the
 *     wire format itself, see preset-link.ts's module doc.
 *   - Rich-text formatting the restricted markup can't express (italic,
 *     strike, lists, text alignment, the fabDash character). The *text* of
 *     such content is still included — see `markupFromContent` — only the
 *     formatting is lost. A run with both bold and underline marks keeps
 *     only bold, since the restricted markup has no way to nest them.
 */

import { isCustomCardBack } from "@fabkit/shared/config/cards/card_backs.ts";
import type { Content } from "@tiptap/react";
import type { CardCreatorCardBack } from "../config/rendering.ts";
import type { CardCreatorState, MeldHalf } from "../stores/card-creator.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `undefined` for a custom frame (not representable) or an unset card back. */
function stockCardBackRef(
	back: CardCreatorCardBack | null,
): { id: number } | undefined {
	if (!back || isCustomCardBack(back)) return undefined;
	return { id: back.id };
}

/**
 * Renders a run of inline Tiptap nodes back to restricted markup. Any node
 * type the restricted markup doesn't support (list items, fabDash, ...) is
 * unwrapped to its own inline content instead of being rejected outright,
 * so nested/unrecognised structure still contributes its text — an atom
 * node with no content (fabDash) simply contributes nothing.
 */
function markupFromInline(nodes: unknown): string {
	if (!Array.isArray(nodes)) return "";
	return nodes
		.map((node) => {
			if (!isRecord(node)) return "";
			if (node.type === "hardBreak") return "\n";
			if (node.type === "emoji" && isRecord(node.attrs)) {
				const name = node.attrs.name;
				return typeof name === "string" ? `:${name}:` : "";
			}
			if (node.type === "text" && typeof node.text === "string") {
				const marks = Array.isArray(node.marks)
					? node.marks
							.filter(isRecord)
							.map((mark) => mark.type)
							.filter((type): type is string => typeof type === "string")
					: [];
				if (marks.includes("bold")) return `**${node.text}**`;
				if (marks.includes("underline")) return `__${node.text}__`;
				return node.text;
			}
			return markupFromInline(node.content);
		})
		.join("");
}

/** Renders a Tiptap `Content` doc back to restricted markup. `""` for empty/null content. */
function markupFromContent(node: Content | null): string {
	if (!isRecord(node) || !Array.isArray(node.content)) return "";
	return node.content
		.map((block) => (isRecord(block) ? markupFromInline(block.content) : ""))
		.join("\n\n");
}

function buildMeldHalfState(half: MeldHalf): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	if (half.CardType) out.CardType = half.CardType;
	if (half.CardName) out.CardName = half.CardName;
	if (half.CardClass) out.CardClass = half.CardClass;
	if (half.CardSecondaryClass) out.CardSecondaryClass = half.CardSecondaryClass;
	if (half.CardSubType) out.CardSubType = half.CardSubType;
	if (half.CardTalent) out.CardTalent = half.CardTalent;
	if (half.CardMacroGroup) out.CardMacroGroup = half.CardMacroGroup;
	if (half.CardWeapon) out.CardWeapon = half.CardWeapon;
	const text = markupFromContent(half.CardTextNode);
	if (text) out.CardText = text;
	return out;
}

/**
 * True when the current card back(s) can't be included in the share link —
 * lets the Share UI warn that the frame won't carry over, rather than
 * silently handing out a link that opens without it.
 */
export function hasUnshareableCardBack(state: CardCreatorState): boolean {
	return (
		isCustomCardBack(state.CardBack) || isCustomCardBack(state.CardBackRight)
	);
}

/** Builds the preset-link payload (the JSON that goes in the `link` search param) for the current form state. */
export function buildPresetLinkPayload(
	state: CardCreatorState,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	if (state.CardType) out.CardType = state.CardType;
	if (state.CardPitch) out.CardPitch = state.CardPitch;
	if (state.CardName) out.CardName = state.CardName;
	if (state.CardResource) out.CardResource = state.CardResource;
	if (state.CardPower) out.CardPower = state.CardPower;
	if (state.CardTalent) out.CardTalent = state.CardTalent;
	if (state.CardClass) out.CardClass = state.CardClass;
	if (state.CardSecondaryClass)
		out.CardSecondaryClass = state.CardSecondaryClass;
	if (state.CardSubType) out.CardSubType = state.CardSubType;
	if (state.CardRarity) out.CardRarity = state.CardRarity;
	if (state.CardDefense) out.CardDefense = state.CardDefense;
	if (state.CardLife) out.CardLife = state.CardLife;
	if (state.CardHeroIntellect) out.CardHeroIntellect = state.CardHeroIntellect;
	if (state.CardWeapon) out.CardWeapon = state.CardWeapon;
	if (state.CardMacroGroup) out.CardMacroGroup = state.CardMacroGroup;
	if (state.CardSetNumber) out.CardSetNumber = state.CardSetNumber;
	if (state.CardArtworkCredits)
		out.CardArtworkCredits = state.CardArtworkCredits;
	out.CardBackStyle = state.CardBackStyle;
	out.CardBackSplit = state.CardBackSplit;
	out.CardBackBlend = state.CardBackBlend;

	const cardBack = stockCardBackRef(state.CardBack);
	if (cardBack) out.CardBack = cardBack;
	const cardBackRight = stockCardBackRef(state.CardBackRight);
	if (cardBackRight) out.CardBackRight = cardBackRight;

	const text = markupFromContent(state.CardTextNode);
	if (text) out.CardText = text;

	if (state.CardType === "meld") {
		out.meldActiveHalf = state.meldActiveHalf;
		const meldHalfA = buildMeldHalfState(state.meldHalfA);
		if (Object.keys(meldHalfA).length > 0) out.meldHalfA = meldHalfA;
		const meldHalfB = buildMeldHalfState(state.meldHalfB);
		if (Object.keys(meldHalfB).length > 0) out.meldHalfB = meldHalfB;
	}

	return out;
}

/**
 * Builds the full shareable URL for the current form state. Defaults to the
 * page's own origin/path (not a hardcoded domain) so this works in dev, on
 * a preview deploy, or under a subpath — hash routing means
 * `location.pathname` never changes between routes, so it always reflects
 * the app's real base. `baseUrl` is overridable so this stays testable
 * without a `window` global (Bun's test runtime doesn't have one).
 */
export function buildPresetLinkUrl(
	state: CardCreatorState,
	baseUrl: string = `${window.location.origin}${window.location.pathname}`,
): string {
	const payload = buildPresetLinkPayload(state);
	return `${baseUrl}#/preset?link=${encodeURIComponent(JSON.stringify(payload))}`;
}
