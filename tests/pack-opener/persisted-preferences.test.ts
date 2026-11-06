import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createPreferenceStorage } from "@fabkit/apps/pack-opener/lib/pack-opener-storage";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import type { StateStorage } from "zustand/middleware";
import { resetStore } from "./reset-store";

const KEY = "pack-opener:preferences";

function memoryStorage(): StateStorage & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (name) => data.get(name) ?? null,
		setItem: (name, value) => {
			data.set(name, value);
		},
		removeItem: (name) => {
			data.delete(name);
		},
	};
}

function saveTo(storage: StateStorage): void {
	usePackOpenerStore.persist.setOptions({
		storage: createPreferenceStorage(() => storage),
	});
}

describe("persisted preferences", () => {
	beforeEach(() => {
		resetStore({ currency: "USD" });
	});

	afterEach(() => {
		usePackOpenerStore.persist.setOptions({
			storage: createPreferenceStorage(),
		});
	});

	it("saves the set and currency, and nothing from the current visit", () => {
		const storage = memoryStorage();
		saveTo(storage);
		usePackOpenerStore.setState({ selectedSet: "DTD" });

		usePackOpenerStore.getState().setCurrency("EUR");

		const saved = JSON.parse(storage.data.get(KEY) ?? "null");
		expect(saved.state).toEqual({ selectedSet: "DTD", currency: "EUR" });
	});

	it("restores them on load without touching the rest of the store", async () => {
		const storage = memoryStorage();
		storage.data.set(
			KEY,
			JSON.stringify({
				state: { selectedSet: "DTD", currency: "EUR" },
				version: 0,
			}),
		);
		saveTo(storage);

		await usePackOpenerStore.persist.rehydrate();

		const state = usePackOpenerStore.getState();
		expect(state.selectedSet).toBe("DTD");
		expect(state.currency).toBe("EUR");
		expect(state.phase).toBe("idle");
		expect(typeof state.openPack).toBe("function");
	});

	it("keeps the action running when a write fails", () => {
		const storage = memoryStorage();
		storage.setItem = () => {
			throw new DOMException("full", "QuotaExceededError");
		};
		saveTo(storage);

		usePackOpenerStore.getState().setCurrency("EUR");

		expect(usePackOpenerStore.getState().currency).toBe("EUR");
	});

	it("starts from the defaults when what's stored can't be parsed", async () => {
		const storage = memoryStorage();
		storage.data.set(KEY, "not json");
		saveTo(storage);

		await usePackOpenerStore.persist.rehydrate();

		expect(usePackOpenerStore.getState().currency).toBe("USD");
	});

	it("works without saving anything when storage is unreachable", () => {
		usePackOpenerStore.persist.setOptions({
			storage: createPreferenceStorage(() => {
				throw new DOMException("blocked", "SecurityError");
			}),
		});

		usePackOpenerStore.getState().setCurrency("EUR");

		expect(usePackOpenerStore.getState().currency).toBe("EUR");
	});
});
