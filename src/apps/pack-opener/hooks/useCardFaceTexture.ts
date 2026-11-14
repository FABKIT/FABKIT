import { useSafeTexture } from "@fabkit/apps/pack-opener/hooks/useSafeTexture";

/** The texture for the face asked for, plus the card's front, which is only
 * requested when that face failed (the host lacks the odd double-faced back). */
export function useCardFaceTexture(
	faceUrl: string | null,
	frontUrl: string | null,
) {
	const face = useSafeTexture(faceUrl);
	const front = useSafeTexture(
		face.status === "error" && faceUrl !== frontUrl ? frontUrl : null,
	);
	return { face, front };
}
