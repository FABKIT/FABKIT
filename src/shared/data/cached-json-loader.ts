/** Per-key JSON loader: dedupes concurrent fetches, caches successes, never caches failures. */
export function createCachedJsonLoader<T>(
	urlFor: (key: string) => string,
	describeFailure: (key: string) => string,
) {
	const cache = new Map<string, T>();
	const inFlight = new Map<string, Promise<T>>();

	async function fetchJson(key: string): Promise<T> {
		try {
			const response = await fetch(urlFor(key));
			if (!response.ok) {
				throw new Error(`${describeFailure(key)}: ${response.status}`);
			}
			const data = (await response.json()) as T;
			cache.set(key, data);
			return data;
		} finally {
			inFlight.delete(key);
		}
	}

	return {
		load(key: string): Promise<T> {
			const cached = cache.get(key);
			if (cached !== undefined) return Promise.resolve(cached);

			const pending = inFlight.get(key);
			if (pending) return pending;

			const promise = fetchJson(key);
			inFlight.set(key, promise);
			return promise;
		},

		/** Undefined until load() for that key has resolved. */
		get(key: string): T | undefined {
			return cache.get(key);
		},
	};
}
