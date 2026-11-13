import { CARD_BACK_URL } from "@fabkit/apps/pack-opener/config/scene";
import { useTranslation } from "react-i18next";

/** How far each card in the stack sits from true, bottom card first. Small
 * and uneven on purpose: a stack someone just put down, not a fan. */
const STACK_TILTS = ["-rotate-6", "rotate-3", "rotate-0"];

/**
 * Route loading screen: the top card is pulled off a short stack on a loop. Renders from
 * the entry chunk, so it must stay free of the store, the scene and three.js. Framed
 * like PackOpenerPage so the page doesn't jump when the real one takes over.
 */
export function PackOpenerLoading() {
	const { t } = useTranslation("pack-opener");

	return (
		<div
			role="status"
			className="flex h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center gap-10 bg-surface px-4 lg:h-dvh"
		>
			<div className="relative h-56 w-40">
				{STACK_TILTS.map((tilt, index) => {
					const isTop = index === STACK_TILTS.length - 1;
					return (
						<div key={tilt} className={`absolute inset-0 ${tilt}`}>
							<img
								src={CARD_BACK_URL}
								alt={isTop ? t("loading.card_back") : ""}
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
