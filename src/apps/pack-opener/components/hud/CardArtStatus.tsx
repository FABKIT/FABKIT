import { resolveCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { useCardFaceTexture } from "@fabkit/apps/pack-opener/hooks/useCardFaceTexture";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { selectActiveCard } from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { ImageOff, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Says why the card on screen is showing the Flesh and Blood card back instead
 * of its art (see CardFace.tsx): either the art is still downloading, or it is
 * not coming. A card back with nothing beside it reads as a face-down card to
 * tap or turn over, and one that only ever said "loading" would keep the player
 * waiting for art that failed for good or that the card never had.
 *
 * This is the one piece of HUD that sits over the card instead of below it.
 * It is allowed to because there is no artwork under it to cover, only the
 * stand-in, and it takes no pointer events, so a tap still reaches the card.
 *
 * It asks the texture cache the same question CardFace does, for the same
 * face, so the two cannot disagree about whether the art has arrived. Art
 * counts as missing only when CardFace has nothing left to fall back to: a back
 * face that failed still shows the card's front, and says nothing.
 *
 * Most cards are preloaded during the tear and never show this at all. The
 * fade-in is delayed so that one arriving a moment late does not flash it.
 */
export function CardArtStatus() {
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

	const { face, front } = useCardFaceTexture(faceUrl, frontUrl);

	if (card === null) return null;

	const isLoading = face.status === "loading" || front.status === "loading";
	const isMissing = face.status === "error" && front.status === "error";
	if (!isLoading && !isMissing) return null;

	const Icon = isLoading ? LoaderCircle : ImageOff;

	return (
		<div
			// Keyed by the card and what is being said about it, so the delayed
			// fade-in starts over instead of carrying on from the previous one.
			key={`${card.id}:${faceUrl}:${isLoading}`}
			role="status"
			className="pointer-events-none absolute inset-0 flex animate-pack-loading-in items-center justify-center"
		>
			<span className="flex items-center gap-2 rounded-full border border-border-primary bg-surface px-4 py-2 text-sm font-medium text-heading shadow-lg">
				<Icon
					className={`h-4 w-4 ${isLoading ? "motion-safe:animate-spin" : ""}`}
					aria-hidden="true"
				/>
				{isLoading ? t("card.loading") : t("card.art_missing")}
			</span>
		</div>
	);
}
