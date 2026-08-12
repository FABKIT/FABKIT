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
 * `customFrames` is passed into getAvailableCardBacks explicitly, rather
 * than having it read the registry internally, so the real dependency is
 * visible to both the useMemo deps array and React Compiler's
 * auto-memoization — a zero-argument call reading external mutable state
 * looks pure to the compiler and can get silently frozen across renders,
 * which is exactly what broke live updates before this was fixed.
 */
export function useAvailableCardBacks(
	type: CardType | null,
	style: CardStyle,
): CardCreatorCardBack[] {
	const customFrames = useCustomFrames();
	return useMemo(
		() => getAvailableCardBacks(customFrames, type, style),
		[type, style, customFrames],
	);
}
