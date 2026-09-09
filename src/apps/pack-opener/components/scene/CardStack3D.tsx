import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { celebrationTierFor } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { Card3D } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import { OutgoingCard } from "@fabkit/apps/pack-opener/components/scene/OutgoingCard";
import { PullCelebration } from "@fabkit/apps/pack-opener/components/scene/PullCelebration";
import {
	CARD_Y_EASE_BASE,
	DONE_CARD_Y_OFFSET,
	REVEALING_CARD_Y_OFFSET,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

/** Hosts the active card (static, always face-up), the glow behind it for a
 * celebrated pull (see cards/celebration-tier.ts), and the previous card
 * sliding away above it — reading as pulling cards, one at a time, off a
 * physical stack. The whole group sits offset by REVEALING_CARD_Y_OFFSET
 * (see config/scene.ts's own comment on why this is a card-position offset
 * rather than a camera move) so the card sits a little lower in the canvas,
 * closing the gap RevealCaption sits in below it. */
export function CardStack3D() {
	const pack = usePackOpenerStore((state) => state.pack);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const phase = usePackOpenerStore((state) => state.phase);
	const phaseStartedAt = usePackOpenerStore((state) => state.phaseStartedAt);
	const advanceReveal = usePackOpenerStore((state) => state.advanceReveal);
	const group = useRef<Group>(null);

	// Eases the whole stack up once the pack is done, clearing the strip the
	// summary occupies — see DONE_CARD_Y_OFFSET. Lerped rather than set
	// straight on the group so the move reads as deliberate.
	useFrame((_, delta) => {
		if (!group.current) return;
		const target =
			phase === "done" ? DONE_CARD_Y_OFFSET : REVEALING_CARD_Y_OFFSET;
		const current = group.current.position.y;
		group.current.position.y =
			current + (target - current) * (1 - CARD_Y_EASE_BASE ** delta);
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
		<group ref={group} position={[0, REVEALING_CARD_Y_OFFSET, 0]}>
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
				<OutgoingCard card={resolvedOutgoing} phaseStartedAt={phaseStartedAt} />
			)}
		</group>
	);
}
