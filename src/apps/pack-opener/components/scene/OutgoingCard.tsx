import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { Card3D } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import {
	CARD_SLIDE_DISTANCE,
	REVEAL_TRANSITION_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

function easeInCubic(t: number): number {
	return t ** 3;
}

interface OutgoingCardProps {
	card: ResolvedCard;
	phaseStartedAt: number | null;
}

/** The just-revealed card, sliding up and off — this is the whole "reveal":
 * pulling the top card off the stack to expose the next one underneath,
 * rather than flipping any card in place. Stays mounted between reveals and
 * self-hides once its slide finishes, restarting fresh on each new
 * phaseStartedAt (see CardStack3D). */
export function OutgoingCard({ card, phaseStartedAt }: OutgoingCardProps) {
	const group = useRef<Group>(null);

	useFrame(() => {
		if (!group.current) return;
		const t =
			phaseStartedAt !== null
				? Math.min((Date.now() - phaseStartedAt) / REVEAL_TRANSITION_MS, 1)
				: 1;
		const eased = easeInCubic(t);
		group.current.position.y = eased * CARD_SLIDE_DISTANCE;
		group.current.position.z = 0.03;
		group.current.rotation.z = eased * 0.07;
		group.current.visible = t < 1;
	});

	return (
		<group ref={group}>
			<Card3D card={card} />
		</group>
	);
}
