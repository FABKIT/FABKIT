import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { useTranslation } from "react-i18next";

/** How far each card in the stack sits from true, bottom card first. Small
 * and uneven on purpose: a stack someone just put down, not a fan. */
const STACK_TILTS = ["-rotate-6", "rotate-3", "rotate-0"];

/**
 * What the route shows while the pack opener's own code and set list are
 * still arriving (see src/routes/pack-opener.tsx). The top card is pulled up
 * and off a short stack, over and over, the same gesture the reveal itself
 * uses, so the wait already looks like the thing being waited for.
 *
 * This renders from the entry chunk, before any of the app has loaded, so it
 * must stay free of the store, the scene and three.js: one image, CSS, and a
 * translated line. The card back is precached by the service worker, so it is
 * there even on the slowest first visit.
 *
 * Framed like PackOpenerPage, the same height with the caption in the same
 * place, so the page does not jump when the real one takes over. With reduced
 * motion on, the stack simply sits still.
 */
export function PackOpenerLoading() {
	const { t } = useTranslation("pack-opener");

	return (
		<div
			role="status"
			className="flex h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center gap-10 bg-surface px-4 lg:h-dvh"
		>
			<div aria-hidden="true" className="relative h-56 w-40">
				{STACK_TILTS.map((tilt, index) => {
					const isTop = index === STACK_TILTS.length - 1;
					return (
						<div key={tilt} className={`absolute inset-0 ${tilt}`}>
							<img
								src={CARD_BACK_URL}
								alt=""
								// Ahead of the app's own chunks on a first visit, when
								// the service worker has not precached it yet.
								fetchPriority="high"
								className={`h-full w-full rounded-lg object-cover shadow-lg ${
									isTop ? "motion-safe:animate-pack-pull" : ""
								}`}
							/>
						</div>
					);
				})}
			</div>
			<p className="text-lg font-medium text-heading motion-safe:animate-pulse">
				{t("loading.label")}
			</p>
		</div>
	);
}
