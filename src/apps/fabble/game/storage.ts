import type { FabbleMode } from "../config";

const memoryFallback = new Map<string, string>();

export const safeStorage = {
	get<T>(key: string): T | null {
		let raw: string | undefined;
		try {
			raw = localStorage.getItem(key) ?? memoryFallback.get(key);
		} catch {
			raw = memoryFallback.get(key);
		}
		if (raw === undefined) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	},

	set(key: string, value: unknown): void {
		const raw = JSON.stringify(value);
		memoryFallback.set(key, raw);
		try {
			localStorage.setItem(key, raw);
		} catch {
			// localStorage unavailable (private mode, quota) — memory fallback already set above.
		}
	},

	remove(key: string): void {
		memoryFallback.delete(key);
		try {
			localStorage.removeItem(key);
		} catch {
			// localStorage unavailable — nothing further to clean up.
		}
	},
};

export const STORAGE_KEYS = {
	session: (m: FabbleMode) => `fabble:session:${m}`,
	streaks: (m: FabbleMode) => `fabble:streaks:${m}`,
	username: "fabble:username",
	seenRules: "fabble:seen-rules",
} as const;
