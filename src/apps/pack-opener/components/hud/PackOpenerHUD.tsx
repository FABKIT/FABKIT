import { IdleOverlay } from "@fabkit/apps/pack-opener/components/hud/IdleOverlay";
import { PackSummary } from "@fabkit/apps/pack-opener/components/hud/PackSummary";
import { RevealBadge } from "@fabkit/apps/pack-opener/components/hud/RevealBadge";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";

export function PackOpenerHUD() {
	const phase = usePackOpenerStore((state) => state.phase);

	return (
		<div className="pointer-events-none absolute inset-0">
			{phase === "idle" && <IdleOverlay />}
			{phase === "revealing" && <RevealBadge />}
			{phase === "done" && (
				<div className="pointer-events-auto absolute inset-0">
					<PackSummary />
				</div>
			)}
		</div>
	);
}
