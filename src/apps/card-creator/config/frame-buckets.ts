/**
 * Frame Buckets
 *
 * A custom frame's real unit of availability isn't a stock manifest entry
 * (e.g. "Assassin") — it's the pair of (frame family, style) that entry
 * belongs to. `(type, dented) -> renderer` is a strict function over the
 * whole manifest (verified against public/cardbacks/cardbacks.json: 14
 * distinct (type, dented) groups, each with exactly one renderer), so which
 * stock entry a mirror claims to copy from is provenance only — it has no
 * effect on where the frame becomes selectable. This module derives the 13
 * real buckets (14 minus meld, which custom frames don't support — see
 * stores/custom-frames.ts) and groups them into families for the
 * availability picker.
 */

import {
	CardBacks,
	getCardBackTypesForCardType,
} from "@fabkit/shared/config/cards/card_backs.ts";
import type { CardStyle } from "@fabkit/shared/config/cards/card_styles.ts";
import { CardStyles } from "@fabkit/shared/config/cards/card_styles.ts";
import { type CardType, CardTypes } from "@fabkit/shared/config/cards/types.ts";
import type {
	CardCreatorCardBack,
	RenderConfigVariation,
} from "./rendering.ts";

export interface FrameBucket {
	/** Stable identity for checkbox state and diffing. */
	key: string;
	/** CardBack.type — the frame family ("general", "hero", …). */
	type: string;
	style: CardStyle;
	renderer: RenderConfigVariation;
	/** First manifest row in this bucket. Stored as a mirror's
	 *  mirrorsCardBackId so the existing StoredCustomFrame shape and
	 *  export/import format don't need to change for this feature. */
	representativeCardBackId: number;
}

export interface FrameFamily {
	type: string;
	buckets: FrameBucket[];
}

/** Display order for families. Anything present in the manifest but absent
 * here is appended, so a new family never silently vanishes from the picker. */
const FAMILY_ORDER = [
	"general",
	"hero",
	"equipment",
	"weapon",
	"token",
	"resource",
	"event",
];

function styleFromDented(dented: boolean): CardStyle {
	return dented ? "dented" : "flat";
}

/** Every pickable (family, style) bucket, derived once from the manifest.
 * Meld is excluded — MeldRenderer has no blob-href path for custom frames,
 * the same reason getCustomFramesForTypeAndStyle excludes it. */
export const FrameBuckets: FrameBucket[] = (() => {
	const byKey = new Map<string, FrameBucket>();
	// CardBacks is typed via the shared, renderer-less CardBack type; every
	// stock row in cardbacks.json actually carries `renderer`, same cast
	// CustomFrameDialog.tsx uses for the same manifest.
	for (const back of CardBacks as CardCreatorCardBack[]) {
		if (back.type === "meld") continue;
		const style = styleFromDented(back.dented);
		const key = getFrameBucketKey(back.type, style);
		if (byKey.has(key)) continue;
		byKey.set(key, {
			key,
			type: back.type,
			style,
			renderer: back.renderer,
			representativeCardBackId: back.id,
		});
	}
	return Array.from(byKey.values());
})();

/** FrameBuckets grouped by family, in FAMILY_ORDER (unlisted families
 * appended at the end so nothing silently disappears from the picker). */
export const FrameFamilies: FrameFamily[] = (() => {
	const byType = new Map<string, FrameBucket[]>();
	for (const bucket of FrameBuckets) {
		const list = byType.get(bucket.type) ?? [];
		list.push(bucket);
		byType.set(bucket.type, list);
	}
	// Stable style order within a family, matching CardStyles.
	for (const buckets of byType.values()) {
		buckets.sort(
			(a, b) => CardStyles.indexOf(a.style) - CardStyles.indexOf(b.style),
		);
	}
	const orderedTypes = [
		...FAMILY_ORDER.filter((type) => byType.has(type)),
		...Array.from(byType.keys()).filter((type) => !FAMILY_ORDER.includes(type)),
	];
	return orderedTypes.map((type) => ({
		type,
		buckets: byType.get(type) ?? [],
	}));
})();

export function getFrameBucketKey(type: string, style: CardStyle): string {
	return `${type}|${style}`;
}

/** The single conversion point between the stored `dented` boolean and the
 * CardStyle string — nothing else in the picker/tile layer should touch
 * `dented` as a literal. */
export function getBucketKeyForFrame(frame: {
	type: string;
	dented: boolean;
}): string {
	return getFrameBucketKey(frame.type, styleFromDented(frame.dented));
}

/**
 * Card types that resolve to this frame family, via
 * getCardBackTypesForCardType's mapping — kept in sync with that function by
 * construction instead of being restated. Meld is excluded explicitly:
 * getCardBackTypesForCardType has no meld case and falls through to its
 * ["general"] default, which getCardBacksForTypeAndStyle only avoids by
 * special-casing meld before ever calling it. Without the same exclusion
 * here, "Meld" would wrongly appear in the Action family's caption.
 */
export function getCardTypesForFamily(type: string): CardType[] {
	return (Object.keys(CardTypes) as CardType[]).filter(
		(cardType) =>
			cardType !== "meld" &&
			getCardBackTypesForCardType(cardType).includes(type),
	);
}
