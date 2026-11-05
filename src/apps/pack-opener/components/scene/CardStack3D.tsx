import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { celebrationTierFor } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { Card3D } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import { CelebrationEffects } from "@fabkit/apps/pack-opener/components/scene/CelebrationEffects";
import { OutgoingCard } from "@fabkit/apps/pack-opener/components/scene/OutgoingCard";
import { revealIntroTransform } from "@fabkit/apps/pack-opener/components/scene/revealIntro";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

/** Hosts the active card (static, always face-up), the effects behind it for a
 * celebrated pull (see cards/celebration-tier.ts), and the previous card sliding
 * away above it, reading as pulling cards one at a time off a physical stack. */
export function CardStack3D() {
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const phase = usePackOpenerStore((state) => state.phase);
	const phaseStartedAt = usePackOpenerStore((state) => state.phaseStartedAt);
	const advanceReveal = usePackOpenerStore((state) => state.advanceReveal);
	const showingOtherFace = usePackOpenerStore(
		(state) => state.showingOtherFace,
	);
	const reducedMotion = usePrefersReducedMotion();
	const revealStartedAt = usePackOpenerStore((state) => state.revealStartedAt);

	// Timed off the store's revealStartedAt, never off this component's own
	// mount: see that field's comment in stores/pack-opener.ts. React remounts
	// this subtree more than once per pack, and a mount-timestamped animation
	// restarts every time. Reading a store timestamp means a remount resumes the
	// animation wherever it actually is, exactly as PackMesh's tear does. Unlike
	// phaseStartedAt this one does not move on each advance, so the arrival plays
	// once per pack.
	//
	// The transform is applied twice on purpose: as this group's initial props
	// below, and again every frame here. See revealIntro.ts for why the props
	// alone are not enough and the useFrame alone is too late.
	const introGroup = useRef<Group>(null);
	const initialIntro = revealIntroTransform(
		revealStartedAt,
		Date.now(),
		reducedMotion,
	);

	useFrame(() => {
		if (!introGroup.current) return;
		const { scale, z } = revealIntroTransform(
			revealStartedAt,
			Date.now(),
			reducedMotion,
		);
		introGroup.current.scale.setScalar(scale);
		introGroup.current.position.z = z;
	});

	// While revisiting a finished pack, the ledger's chosen card takes over as
	// "active": no advance on tap and no outgoing slide, but still tiltable,
	// since read-only doesn't mean frozen.
	const isRevisiting = phase === "done" && revisitIndex !== null;
	const activeIndex = isRevisiting ? revisitIndex : revealIndex;

	const activeDrawn =
		pack && activeIndex >= 0 && activeIndex < pack.length
			? pack[activeIndex]
			: null;
	const outgoingDrawn =
		!isRevisiting && pack && revealIndex > 0 ? pack[revealIndex - 1] : null;

	const resolvedCard = activeDrawn
		? activeCardResolver.resolve(activeDrawn, packSetCode ?? undefined)
		: null;
	const resolvedOutgoing = outgoingDrawn
		? activeCardResolver.resolve(outgoingDrawn, packSetCode ?? undefined)
		: null;
	const celebrationTier = resolvedCard
		? celebrationTierFor(resolvedCard)
		: null;

	if (!resolvedCard) return null;

	return (
		// The intro group carries the whole stack, effects included, so the
		// celebration scales in with its card instead of arriving at full size
		// beside a card that is still growing.
		<group
			ref={introGroup}
			scale={initialIntro.scale}
			position={[0, 0, initialIntro.z]}
		>
			{celebrationTier && (
				<CelebrationEffects
					tier={celebrationTier}
					phaseStartedAt={phaseStartedAt}
				/>
			)}
			{/* Only the ACTIVE card can be turned over. The outgoing card below is
			    a snapshot of what the player already looked at, and flipping it
			    mid-slide would be a change they did not ask for. */}
			<Card3D
				card={resolvedCard}
				showOtherFace={showingOtherFace}
				onClick={() => phase === "revealing" && advanceReveal()}
			/>
			{resolvedOutgoing && (
				<OutgoingCard card={resolvedOutgoing} phaseStartedAt={phaseStartedAt} />
			)}
		</group>
	);
}
