import { FABBLE_DATA_URL } from "../config";
import type { FabbleDataset } from "../types";

const CACHE_NAME = "fabble-data";

function isValidDataset(data: unknown): data is FabbleDataset {
	if (typeof data !== "object" || data === null) return false;
	const d = data as Partial<FabbleDataset>;
	return d.schemaVersion === 1 && Array.isArray(d.cards) && d.cards.length > 0;
}

async function cacheResponse(
	request: string,
	response: Response,
): Promise<void> {
	try {
		const cache = await caches.open(CACHE_NAME);
		await cache.put(request, response);
	} catch {
		// Cache API unavailable (e.g. private mode) — ignore, offline replay just won't work.
	}
}

export async function loadDataset(): Promise<FabbleDataset> {
	try {
		const response = await fetch(FABBLE_DATA_URL);
		if (!response.ok)
			throw new Error(`Fabble dataset fetch failed: ${response.status}`);
		const cloned = response.clone();
		const data = await response.json();
		if (!isValidDataset(data))
			throw new Error("Fabble dataset failed validation");
		await cacheResponse(FABBLE_DATA_URL, cloned);
		return data;
	} catch (fetchError) {
		try {
			const cached = await caches.match(FABBLE_DATA_URL);
			if (cached) {
				const data = await cached.json();
				if (isValidDataset(data)) return data;
			}
		} catch {
			// Cache API unavailable — fall through to throw below.
		}
		throw fetchError;
	}
}
