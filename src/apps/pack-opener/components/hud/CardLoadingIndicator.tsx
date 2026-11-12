import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { useSafeTexture } from "@fabkit/apps/pack-opener/hooks/useSafeTexture";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { selectActiveCard } from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Says so while the card on screen is still downloading its art. Until it
 * arrives the scene shows the Flesh and Blood card back (see CardFace.tsx),
 * and a card back with nothing beside it reads as a face-down card to tap or
 * turn over rather than as one that is on its way.
 *
 * This is the one piece of HUD that sits over the canvas instead of below it.
 * It is allowed to because there is no artwork under it to cover, only the
 * stand-in, and it takes no pointer events, so a tap still reaches the card.
 *
 * It asks the texture cache the same question CardFace does, for the same
 * face, so the two cannot disagree about whether the art has arrived. A card
 * whose art failed for good, or a placeholder with none, is not loading and
 * shows nothing.
 *
 * Most cards are preloaded during the tear and never show this at all. The
 * fade-in is delayed so that one arriving a moment late does not flash it.
 */
export function CardLoadingIndicator() {
	const { t } = useTranslation("pack-opener");
	const drawn = usePackOpenerStore(selectActiveCard);
	const packSetCode = usePackOpenerStore((state) => state.packSetCode);
	const phase = usePackOpenerStore((state) => state.phase);
	const showingOtherFace = usePackOpenerStore(
		(state) => state.showingOtherFace,
	);

	const showsCard = phase === "revealing" || phase === "done";
	const card = drawn && showsCard ? resolveCard(drawn, packSetCode) : null;
	const frontUrl = card?.imageUrl ?? null;
	const faceUrl =
		showingOtherFace && card?.backImageUrl ? card.backImageUrl : frontUrl;

	// The same two lookups, in the same order, as CardFace: the face asked
	// for, then the front when the other side of a double-faced card failed.
	const face = useSafeTexture(faceUrl);
	const front = useSafeTexture(
		face.status === "error" && faceUrl !== frontUrl ? frontUrl : null,
	);

	const isLoading =
		faceUrl !== null &&
		(face.status === "loading" || front.status === "loading");
	if (!isLoading) return null;

	return (
		<div
			// Keyed by the art so the delayed fade-in starts over for each card
			// instead of carrying on from the previous one.
			key={faceUrl}
			role="status"
			className="pointer-events-none absolute inset-0 flex animate-pack-loading-in items-center justify-center"
		>
			<span className="flex items-center gap-2 rounded-full border border-border-primary bg-surface px-4 py-2 text-sm font-medium text-heading shadow-lg">
				<LoaderCircle
					className="h-4 w-4 motion-safe:animate-spin"
					aria-hidden="true"
				/>
				{t("card.loading")}
			</span>
		</div>
	);
}
