import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { celebrationTierFor } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { Card3D } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import { OutgoingCard } from "@fabkit/apps/pack-opener/components/scene/OutgoingCard";
import { PullCelebration } from "@fabkit/apps/pack-opener/components/scene/PullCelebration";
import { revealIntroTransform } from "@fabkit/apps/pack-opener/components/scene/revealIntro";
import { CARD_Y_OFFSET } from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

/** Hosts the active card (static, always face-up), the glow behind it for a
 * celebrated pull (see cards/celebration-tier.ts), and the previous card
 * sliding away above it — reading as pulling cards, one at a time, off a
 * physical stack. The group sits at CARD_Y_OFFSET, which is simply centred:
 * the card details and the summary each take their own space in the page
 * below the canvas now (see PackOpenerPage.tsx), so there is nothing for
 * the card to dodge. */
export function CardStack3D() {
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const phase = usePackOpenerStore((state) => state.phase);
	const phaseStartedAt = usePackOpenerStore((state) => state.phaseStartedAt);
	const advanceReveal = usePackOpenerStore((state) => state.advanceReveal);
	const reducedMotion = usePrefersReducedMotion();
	const revealStartedAt = usePackOpenerStore((state) => state.revealStartedAt);

	// Timed off the store's revealStartedAt, never off this component's own
	// mount — see that field's comment in stores/pack-opener.ts. React
	// remounts this subtree more than once per pack, and a mount-timestamped
	// animation restarts every time. Reading a store timestamp means a
	// remount resumes the animation wherever it actually is, exactly as
	// PackMesh's tear does. Unlike phaseStartedAt this one does not move on
	// each advance, so the arrival plays once per pack.
	//
	// The transform is applied twice on purpose: as this group's initial
	// props below, and again every frame here. See revealIntro.ts for why
	// the props alone are not enough and the useFrame alone is too late.
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

	// While revisiting a finished pack, the ledger's chosen card takes over
	// as "active" — read-only (see the guarded onClick below), no outgoing
	// slide, but still tiltable (Card3D's `interactive` stays at its
	// default true — read-only means no advance-on-tap, not no tilt).
	const isRevisiting = phase === "done" && revisitIndex !== null;
	const activeIndex =
		revisitIndex !== null && phase === "done" ? revisitIndex : revealIndex;

	const activeDrawn =
		pack && activeIndex >= 0 && activeIndex < pack.length
			? pack[activeIndex]
			: null;
	const outgoingDrawn =
		!isRevisiting && pack && revealIndex > 0 ? pack[revealIndex - 1] : null;

	const resolvedCard = useMemo(
		() =>
			activeDrawn
				? activeCardResolver.resolve(activeDrawn, packSetCode ?? undefined)
				: null,
		[activeDrawn, packSetCode],
	);
	const resolvedOutgoing = useMemo(
		() =>
			outgoingDrawn
				? activeCardResolver.resolve(outgoingDrawn, packSetCode ?? undefined)
				: null,
		[outgoingDrawn, packSetCode],
	);
	const celebrationTier = useMemo(
		() => (resolvedCard ? celebrationTierFor(resolvedCard) : null),
		[resolvedCard],
	);

	if (!resolvedCard) return null;

	return (
		<group position={[0, CARD_Y_OFFSET, 0]}>
			{/* The intro group carries the whole stack, glow included, so the
			    celebration scales in with its card instead of arriving at full
			    size beside a card that is still growing. Starts at
			    REVEAL_INTRO_START_SCALE, which is why the group's own resting
			    transform is left to the useFrame above rather than set here. */}
			<group
				ref={introGroup}
				scale={initialIntro.scale}
				position={[0, 0, initialIntro.z]}
			>
				{celebrationTier && (
					<PullCelebration
						tier={celebrationTier}
						phaseStartedAt={phaseStartedAt}
					/>
				)}
				<Card3D
					card={resolvedCard}
					onClick={() =>
						!isRevisiting && phase === "revealing" && advanceReveal()
					}
				/>
				{resolvedOutgoing && (
					<OutgoingCard
						card={resolvedOutgoing}
						phaseStartedAt={phaseStartedAt}
					/>
				)}
			</group>
		</group>
	);
}
