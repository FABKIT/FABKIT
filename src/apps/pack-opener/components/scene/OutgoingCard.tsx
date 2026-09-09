import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { Card3D } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import {
	CARD_SLIDE_DISTANCE,
	REVEAL_TRANSITION_MS,
} from "@fabkit/apps/pack-opener/config/scene";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
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
 * phaseStartedAt (see CardStack3D).
 *
 * The z offset (0.03) below is intentionally small and does NOT by itself
 * guarantee this card renders in front of the active one underneath — the
 * active card can tilt up to CARD_TILT_MAX_DEG with the pointer, and at the
 * corners that swings it geometrically well past this gap (see the
 * execution plan, section 2.2). `alwaysOnTop` on Card3D below is what
 * actually keeps this card on top regardless of that overlap, by disabling
 * depth testing on its material and raising its renderOrder — the z offset
 * just keeps the two planes from perfectly coinciding. */
export function OutgoingCard({ card, phaseStartedAt }: OutgoingCardProps) {
	const group = useRef<Group>(null);

	// This group is reused across every reveal in a pack, so it arrives at
	// each new one still holding the END of the previous slide: pushed off
	// the top of the frame and hidden. React swaps the card in during
	// commit, but nothing repairs the transform until the next useFrame
	// tick — which is one rendered frame of the incoming card showing
	// uncovered before the outgoing card snaps back into place and slides.
	// That is the momentary flash-through. Resetting in a layout effect
	// puts the group in its correct starting state during the same commit
	// that swaps the card, so there is no frame in between.
	// biome-ignore lint/correctness/useExhaustiveDependencies: phaseStartedAt is the reset trigger, not a value read here — a new timestamp means a new reveal has started and this group has to go back to its start pose.
	useLayoutEffect(() => {
		if (!group.current) return;
		group.current.position.set(0, 0, 0.03);
		group.current.rotation.z = 0;
		group.current.visible = true;
	}, [phaseStartedAt]);

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
			<Card3D card={card} interactive={false} alwaysOnTop />
		</group>
	);
}
