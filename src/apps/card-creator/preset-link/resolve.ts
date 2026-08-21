/**
 * Preset-Link Card-Back Resolution
 *
 * Resolves a preset link's `CardBack`/`CardBackRight` reference to a stock
 * CardCreatorCardBack by id, against the static, checked-in `CardBacks`
 * manifest (shared/config/cards/card_backs.ts). No network fetch — stock
 * ids are stable across every install. Custom (image-URL-based) card backs
 * are out of scope for preset links; use the interactive upload dialog in
 * the editor instead.
 */

import { CardBacks } from "@fabkit/shared/config/cards/card_backs.ts";
import type { CardCreatorCardBack } from "../config/rendering.ts";

export interface PresetCardBackRef {
	id: number;
}

/**
 * Resolves a stock card-back reference to a live CardCreatorCardBack. `null`
 * when the reference is absent or the id doesn't exist in the manifest.
 */
export function resolveCardBack(
	ref: PresetCardBackRef | null,
): CardCreatorCardBack | null {
	if (!ref) return null;
	const back = CardBacks.find((entry) => entry.id === ref.id);
	if (!back) {
		console.error(
			`[preset-link] stock card back: id ${ref.id} does not exist in the current cardbacks manifest. Dropping this field.`,
		);
		return null;
	}
	return back as CardCreatorCardBack;
}
