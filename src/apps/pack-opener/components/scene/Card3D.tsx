import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { CardFace } from "@fabkit/apps/pack-opener/components/scene/CardFace";
import { useCardTilt } from "@fabkit/apps/pack-opener/hooks/useCardTilt";

interface Card3DProps {
	card: ResolvedCard;
	onClick?: () => void;
	/** False for the outgoing (sliding-away) card in OutgoingCard.tsx: not
	 * interactive, so it tracks no pointer and stays flat. Tilt lives entirely
	 * inside this component; the reveal slide stays on OutgoingCard's own
	 * separate group, so the two never touch the same transform. */
	interactive?: boolean;
	/** True only for the outgoing card. The card underneath tilts with the
	 * pointer (up to CARD_TILT_MAX_DEG), which at the corners swings it past the
	 * small gap OutgoingCard's z offset leaves between the two, so the active
	 * card could poke through mid-slide. Disabling depth testing and writing on
	 * the outgoing card's material and raising its renderOrder makes it always
	 * paint on top. That's safe because only these two cards are in the scene
	 * during a reveal (PackMesh is unmounted then, see PackOpenerCanvas.tsx). */
	alwaysOnTop?: boolean;
	/** Show the other side of a double-faced card instead of its front (see the
	 * store's showingOtherFace, and card-resolver.ts's backImageUrl).
	 *
	 * This swaps the texture; it does not rotate the card. Cards in this scene
	 * never rotate as part of a reveal (see this app's CLAUDE.md), and a player
	 * asking to read the other side wants to read it, not watch it spin. */
	showOtherFace?: boolean;
}

/** A single face-up card. Always static in place: reveals happen by sliding the
 * previous card away (see OutgoingCard), never by turning this one over. What
 * does rotate is the pointer tilt on this group (see useCardTilt). */
export function Card3D({
	card,
	onClick,
	interactive = true,
	alwaysOnTop = false,
	showOtherFace = false,
}: Card3DProps) {
	const { group, lightDir } = useCardTilt(interactive);

	return (
		<group ref={group}>
			<CardFace
				card={card}
				showOtherFace={showOtherFace}
				onClick={onClick}
				lightDirRef={lightDir}
				alwaysOnTop={alwaysOnTop}
			/>
		</group>
	);
}
