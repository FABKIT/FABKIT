import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { Card3D } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import { outgoingSlideTransform } from "@fabkit/apps/pack-opener/components/scene/outgoingSlide";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

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
 * The transform is applied twice on purpose: as this group's initial props,
 * and again every frame. See outgoingSlide.ts for why the props alone are
 * not enough and the frame callback alone is too late — that is what fixes
 * the next card flashing through on a fast run of taps.
 *
 * The z offset (0.03) is intentionally small and does NOT by itself
 * guarantee this card renders in front of the active one underneath — the
 * active card can tilt up to CARD_TILT_MAX_DEG with the pointer, and at the
 * corners that swings it geometrically well past this gap (see the
 * execution plan, section 2.2). `alwaysOnTop` on Card3D below is what
 * actually keeps this card on top regardless of that overlap, by disabling
 * depth testing on its material and raising its renderOrder — the z offset
 * just keeps the two planes from perfectly coinciding. */
export function OutgoingCard({ card, phaseStartedAt }: OutgoingCardProps) {
	const group = useRef<Group>(null);
	const initial = outgoingSlideTransform(phaseStartedAt, Date.now());

	useFrame(() => {
		if (!group.current) return;
		const { y, z, rotationZ, visible } = outgoingSlideTransform(
			phaseStartedAt,
			Date.now(),
		);
		group.current.position.set(0, y, z);
		group.current.rotation.z = rotationZ;
		group.current.visible = visible;
	});

	return (
		<group
			ref={group}
			position={[0, initial.y, initial.z]}
			rotation={[0, 0, initial.rotationZ]}
			visible={initial.visible}
		>
			<Card3D card={card} interactive={false} alwaysOnTop />
		</group>
	);
}
