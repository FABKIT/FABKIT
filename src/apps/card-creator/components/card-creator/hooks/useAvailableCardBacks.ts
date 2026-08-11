import { getAvailableCardBacks } from "@fabkit/apps/card-creator/config/card-backs.ts";
import type { CardCreatorCardBack } from "@fabkit/apps/card-creator/config/rendering.ts";
import { useCustomFrames } from "@fabkit/apps/card-creator/stores/custom-frames.ts";
import type { CardStyle } from "@fabkit/shared/config/cards/card_styles.ts";
import type { CardType } from "@fabkit/shared/config/cards/types.ts";
import { useMemo } from "react";

/**
 * Stock-then-custom merged card-back list for a type/style, recomputed
 * whenever the custom-frames registry changes (a new upload, or the registry
 * finishing its initial hydrate) — not just when type/style change.
 *
 * getAvailableCardBacks reads the registry's singleton state directly rather
 * than through the subscribed value, so `customFrames` is only referenced as
 * a useMemo dependency (the `void` is there purely to make that dependency
 * honest to the exhaustive-deps lint rule, which can't see the indirection).
 */
export function useAvailableCardBacks(
	type: CardType | null,
	style: CardStyle,
): CardCreatorCardBack[] {
	const customFrames = useCustomFrames();
	return useMemo(() => {
		void customFrames;
		return getAvailableCardBacks(type, style);
	}, [type, style, customFrames]);
}
