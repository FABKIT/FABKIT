import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { Card3D } from "@fabkit/apps/pack-opener/components/scene/Card3D";
import { OutgoingCard } from "@fabkit/apps/pack-opener/components/scene/OutgoingCard";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { useMemo } from "react";

/** Hosts the active card (static, always face-up) and the previous card
 * sliding away above it — reading as pulling cards, one at a time, off a
 * physical stack. */
export function CardStack3D() {
	const pack = usePackOpenerStore((state) => state.pack);
	const revealIndex = usePackOpenerStore((state) => state.revealIndex);
	const revisitIndex = usePackOpenerStore((state) => state.revisitIndex);
	const phase = usePackOpenerStore((state) => state.phase);
	const phaseStartedAt = usePackOpenerStore((state) => state.phaseStartedAt);
	const advanceReveal = usePackOpenerStore((state) => state.advanceReveal);

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
		() => (activeDrawn ? activeCardResolver.resolve(activeDrawn) : null),
		[activeDrawn],
	);
	const resolvedOutgoing = useMemo(
		() => (outgoingDrawn ? activeCardResolver.resolve(outgoingDrawn) : null),
		[outgoingDrawn],
	);

	if (!resolvedCard) return null;

	return (
		<group>
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
