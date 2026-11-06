import {
	createJSONStorage,
	type PersistStorage,
	type StateStorage,
} from "zustand/middleware";

/** zustand's own JSON storage, with one change: a failed write is dropped.
 * persist writes inside every set(), so with the default storage a full or
 * blocked localStorage throws out of whichever action was running, after its
 * state changed but before the rest of it ran. openPack would never schedule
 * the end of the tear, leaving the pack stuck. Losing a preference on reload is
 * a fine degrade; losing the pack isn't. When storage can't be reached at all,
 * this also spares the console persist's warning on every set(). */
export function createPreferenceStorage<T>(
	getStorage: () => StateStorage = () => window.localStorage,
): PersistStorage<T> {
	const storage = createJSONStorage<T>(getStorage);
	return {
		getItem: (name) => storage?.getItem(name) ?? null,
		setItem: (name, value) => {
			try {
				storage?.setItem(name, value);
			} catch {
				// See above: the preference just won't survive a reload.
			}
		},
		removeItem: (name) => storage?.removeItem(name),
	};
}
