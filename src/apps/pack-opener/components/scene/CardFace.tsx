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

/** The card's plane. Shows the best available art: the face asked for, then the
 * card's front (a back-face image can be missing), then the card back while loading
 * or on failure. One material whose texture changes, so art arriving is only a prop
 * change. */
export function CardFace({
	card,
	showOtherFace,
	onClick,
	lightDirRef,
	alwaysOnTop,
}: CardFaceProps) {
	// Fall back to the front when there is no other face to show.
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
