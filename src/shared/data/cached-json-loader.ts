/** A per-key JSON file loader: concurrent calls for one key share a request,
 * later ones reuse the result, and a failure isn't cached, so the next call
 * retries instead of replaying it until a reload. */
export function createCachedJsonLoader<T>(
	urlFor: (key: string) => string,
	describeFailure: (key: string) => string,
) {
	const cache = new Map<string, T>();
	const inFlight = new Map<string, Promise<T>>();

	return {
		load(key: string): Promise<T> {
			const cached = cache.get(key);
			if (cached !== undefined) return Promise.resolve(cached);

			const pending = inFlight.get(key);
			if (pending) return pending;

			const promise = fetch(urlFor(key))
				.then((response) => {
					if (!response.ok) {
						throw new Error(`${describeFailure(key)}: ${response.status}`);
					}
					return response.json() as Promise<T>;
				})
				.then((data) => {
					cache.set(key, data);
					return data;
				})
				.finally(() => {
					inFlight.delete(key);
				});

			inFlight.set(key, promise);
			return promise;
		},

		/** Undefined until load() for that key has resolved. */
		get(key: string): T | undefined {
			return cache.get(key);
		},
	};
}
