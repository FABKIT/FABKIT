import type { FabbleMode } from "@fabkit/apps/fabble/config";

const memoryFallback = new Map<string, string>();

let storageWarned = false;

/** Graceful degradation is intentional (private mode, quota) — the in-memory
 * fallback keeps the session playable. Log once so failures aren't invisible. */
function warnStorageUnavailable(error: unknown): void {
	if (storageWarned) return;
	storageWarned = true;
	console.warn(
		"Fabble: localStorage unavailable, using memory fallback",
		error,
	);
}

export const safeStorage = {
	get<T>(key: string): T | null {
		let raw: string | undefined;
		try {
			raw = localStorage.getItem(key) ?? memoryFallback.get(key);
		} catch (error) {
			warnStorageUnavailable(error);
			raw = memoryFallback.get(key);
		}
		if (raw === undefined) return null;
		try {
			return JSON.parse(raw) as T;
		} catch (error) {
			console.warn(`Fabble: corrupt stored value for "${key}"`, error);
			return null;
		}
	},

	set(key: string, value: unknown): void {
		const raw = JSON.stringify(value);
		memoryFallback.set(key, raw);
		try {
			localStorage.setItem(key, raw);
		} catch (error) {
			warnStorageUnavailable(error);
		}
	},

	remove(key: string): void {
		memoryFallback.delete(key);
		try {
			localStorage.removeItem(key);
		} catch (error) {
			warnStorageUnavailable(error);
		}
	},
};

export const STORAGE_KEYS = {
	session: (mode: FabbleMode) => `fabble:session:${mode}`,
	streaks: (mode: FabbleMode) => `fabble:streaks:${mode}`,
	username: "fabble:username",
	seenRules: "fabble:seen-rules",
	seenRainbowHint: "fabble:seen-rainbow-hint",
} as const;
