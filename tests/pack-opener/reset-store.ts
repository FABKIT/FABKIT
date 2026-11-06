import { DEFAULT_PACK_CONFIG } from "@fabkit/apps/pack-opener/pack/odds";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import type { PackOpenerState } from "@fabkit/apps/pack-opener/stores/pack-opener-types";

/** Puts the store back to its starting state, on the mock set, so no field can
 * leak from one test into the next. */
export function resetStore(overrides: Partial<PackOpenerState> = {}): void {
	usePackOpenerStore.setState({
		...usePackOpenerStore.getInitialState(),
		selectedSet: DEFAULT_PACK_CONFIG.id,
		...overrides,
	});
}
