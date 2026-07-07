import { FABBLE_DATA_URL } from "@fabkit/apps/fabble/config";
import type { FabbleDataset } from "@fabkit/apps/fabble/types";

const CACHE_NAME = "fabble-data";

function isValidDataset(data: unknown): data is FabbleDataset {
	if (typeof data !== "object" || data === null) return false;
	const candidate = data as Partial<FabbleDataset>;
	return (
		candidate.schemaVersion === 1 &&
		Array.isArray(candidate.cards) &&
		candidate.cards.length > 0
	);
}

async function cachePayload(
	request: string,
	payload: FabbleDataset,
): Promise<void> {
	try {
		const cache = await caches.open(CACHE_NAME);
		await cache.put(
			request,
			new Response(JSON.stringify(payload), {
				headers: { "Content-Type": "application/json" },
			}),
		);
	} catch (error) {
		// Cache API unavailable (e.g. private mode) — only offline replay is
		// affected; the freshly fetched dataset is still returned to the caller.
		console.warn("Fabble: dataset cache write failed", error);
	}
}

export async function loadDataset(): Promise<FabbleDataset> {
	try {
		const response = await fetch(FABBLE_DATA_URL);
		if (!response.ok)
			throw new Error(`Fabble dataset fetch failed: ${response.status}`);
		const data = await response.json();
		if (!isValidDataset(data))
			throw new Error("Fabble dataset failed validation");
		await cachePayload(FABBLE_DATA_URL, data);
		return data;
	} catch (fetchError) {
		console.error("Fabble: dataset fetch failed", fetchError);
		try {
			const cached = await caches.match(FABBLE_DATA_URL);
			if (cached) {
				const data = await cached.json();
				if (isValidDataset(data)) return data;
			}
		} catch (cacheError) {
			console.warn("Fabble: dataset cache read failed", cacheError);
		}
		throw fetchError;
	}
}
