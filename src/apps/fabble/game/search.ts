import { MAX_SEARCH_RESULTS } from "../config";
import type { FabbleCard } from "../types";
import { normalizeCardName } from "./normalize";

export interface SearchEntry {
	id: string;
	name: string;
	normalized: string;
}

export function buildSearchIndex(cards: FabbleCard[]): SearchEntry[] {
	return cards.map((c) => ({
		id: c.id,
		name: c.name,
		normalized: normalizeCardName(c.name),
	}));
}

export function searchCards(
	index: SearchEntry[],
	query: string,
): SearchEntry[] {
	const q = normalizeCardName(query);
	if (q === "") return [];

	const startsWith: SearchEntry[] = [];
	const includes: SearchEntry[] = [];
	for (const entry of index) {
		if (entry.normalized.startsWith(q)) {
			startsWith.push(entry);
		} else if (entry.normalized.includes(q)) {
			includes.push(entry);
		}
	}
	const byName = (a: SearchEntry, b: SearchEntry) =>
		a.name.localeCompare(b.name);
	startsWith.sort(byName);
	includes.sort(byName);

	return [...startsWith, ...includes].slice(0, MAX_SEARCH_RESULTS);
}
