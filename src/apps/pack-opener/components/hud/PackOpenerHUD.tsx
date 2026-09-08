import { IdleOverlay } from "@fabkit/apps/pack-opener/components/hud/IdleOverlay";
import { PackSummary } from "@fabkit/apps/pack-opener/components/hud/PackSummary";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";

/** Overlays that sit ON the canvas — idle's tap prompt and the done-phase
 * summary ledger. The reveal caption used to live here too (as RevealBadge)
 * but doesn't anymore: it's rendered in normal document flow below the
 * canvas instead (see PackOpenerPage.tsx and RevealCaption.tsx), so it can
 * never overlap the card. */
export function PackOpenerHUD() {
	const phase = usePackOpenerStore((state) => state.phase);

	return (
		<div className="pointer-events-none absolute inset-0">
			{phase === "idle" && <IdleOverlay />}
			{phase === "done" && (
				<div className="pointer-events-auto absolute inset-0">
					<PackSummary />
				</div>
			)}
		</div>
	);
}
