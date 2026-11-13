import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import {
	CardFaceMaterial,
	type LightDirRef,
} from "@fabkit/apps/pack-opener/components/scene/CardFaceMaterial";
import {
	CARD_BACK_URL,
	CARD_HEIGHT,
	CARD_WIDTH,
} from "@fabkit/apps/pack-opener/config/scene";
import { useCardFaceTexture } from "@fabkit/apps/pack-opener/hooks/useCardFaceTexture";
import { useSafeTexture } from "@fabkit/apps/pack-opener/hooks/useSafeTexture";

interface CardFaceProps {
	card: ResolvedCard;
	showOtherFace: boolean;
	onClick?: () => void;
	lightDirRef: LightDirRef;
	alwaysOnTop: boolean;
}

/** The card's plane, and which art it shows. A real card's image already is the
 * full rendered face, so this only has to pick one, best available first:
 *
 *  1. The face asked for. Normally already cached, since the store preloads a
 *     pack's art as it opens.
 *  2. The card's front, if the other side of a double-faced card failed. The
 *     image host is missing the odd back-face image, and the card's own front
 *     beats a stand-in that looks nothing like it.
 *  3. The card back, while either of those loads, if they failed for good, or
 *     for a placeholder with no art at all. It keeps the card's treatment, so a
 *     foil pull still reads as one.
 *
 * Failures are normal here rather than exceptional: see lib/texture-cache.ts.
 *
 * ONE material, whose texture changes. Art arriving is only ever a prop change,
 * never one material swapped for another. It used to return a separate card
 * back component while loading, which unmounted one material and mounted
 * another in the same slot, and that was measured leaving the card back stuck
 * on screen even after the real art had downloaded. Going by r3f 9.8's source
 * that swap should now detach and reattach correctly, but nothing here relies
 * on it: `treatment` reads from the card, not from whether the art has arrived,
 * and a plain-to-foil change between cards gets a fresh mesh through the key. */
export function CardFace({
	card,
	showOtherFace,
	onClick,
	lightDirRef,
	alwaysOnTop,
}: CardFaceProps) {
	// Falls back to the front whenever there is no other face to show, so a
	// stale flip can never blank a single-faced card.
	const faceUrl =
		showOtherFace && card.backImageUrl !== null
			? card.backImageUrl
			: card.imageUrl;
	const { face, front } = useCardFaceTexture(faceUrl, card.imageUrl);
	const cardBack = useSafeTexture(CARD_BACK_URL);

	const texture =
		face.status === "loaded"
			? face.texture
			: front.status === "loaded"
				? front.texture
				: cardBack.status === "loaded"
					? cardBack.texture
					: null;

	return (
		<mesh
			key={card.treatment === "standard" ? "plain" : "foil"}
			// Hidden only if even the self-hosted card back is unavailable. A mesh
			// with no material of its own would otherwise paint a white plane.
			visible={texture !== null}
			onClick={onClick}
			renderOrder={alwaysOnTop ? 1 : 0}
		>
			<planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
			{texture !== null && (
				<CardFaceMaterial
					texture={texture}
					treatment={card.treatment}
					isMarvel={card.rarity === "marvel"}
					lightDirRef={lightDirRef}
					alwaysOnTop={alwaysOnTop}
				/>
			)}
		</mesh>
	);
}
