import {
	createPriceReader,
	type PriceReader,
} from "@fabkit/apps/pack-opener/lib/pricing";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";

/** Prices in the selected currency, kept current as snapshots arrive. The
 * snapshots live in module caches React cannot watch, so a figure read before
 * its file landed would otherwise stay missing until something unrelated
 * re-rendered. */
export function usePrices(): PriceReader {
	const currency = usePackOpenerStore((state) => state.currency);
	const pricesVersion = usePackOpenerStore((state) => state.pricesVersion);
	return createPriceReader(currency, pricesVersion);
}
