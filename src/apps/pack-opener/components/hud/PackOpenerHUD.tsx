import { IdleOverlay } from "@fabkit/apps/pack-opener/components/hud/IdleOverlay";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";

/** Overlays that genuinely sit ON the canvas. That is only the idle tap
 * prompt now: the reveal caption and the pack summary both live in normal
 * document flow beneath the canvas instead (see PackOpenerPage.tsx), so
 * neither can cover the card. */
export function PackOpenerHUD() {
	const phase = usePackOpenerStore((state) => state.phase);

	return (
		<div className="pointer-events-none absolute inset-0">
			{phase === "idle" && <IdleOverlay />}
		</div>
	);
}
