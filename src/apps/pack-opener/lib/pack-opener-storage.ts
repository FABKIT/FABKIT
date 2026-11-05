import type { Currency } from "@fabkit/apps/pack-opener/lib/currency";

const SELECTED_SET_STORAGE_KEY = "pack-opener:selected-set";
const CURRENCY_STORAGE_KEY = "pack-opener:currency";

/** Deliberately not a shared safeStorage util (see Fabble's
 * src/apps/fabble/game/storage.ts) — apps can't import each other, and
 * this store only touches two keys, so a tiny inline try/catch per key is
 * simpler than a new shared module for it. */
export function readStoredSelectedSet(): string | null {
	try {
		return localStorage.getItem(SELECTED_SET_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function writeStoredSelectedSet(setCode: string): void {
	try {
		localStorage.setItem(SELECTED_SET_STORAGE_KEY, setCode);
	} catch {
		// Private mode / quota exceeded — the selection just won't survive
		// a reload, which is a fine degrade for a preference like this.
	}
}

/** Dollars unless this visitor has said otherwise. Deliberately not guessed
 * from the browser's locale: a euro price here is a Cardmarket price, and
 * a visitor's language says nothing about which marketplace they buy from.
 * They pick once and it sticks. */
export function readStoredCurrency(): Currency {
	try {
		return localStorage.getItem(CURRENCY_STORAGE_KEY) === "EUR" ? "EUR" : "USD";
	} catch {
		return "USD";
	}
}

export function writeStoredCurrency(currency: Currency): void {
	try {
		localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
	} catch {
		// Same fine degrade as the set selection above.
	}
}
