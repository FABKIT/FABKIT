import { MAX_SEARCH_RESULTS } from "@fabkit/apps/fabble/config";
import { normalizeCardName } from "@fabkit/apps/fabble/game/normalize";
import type { FabbleCard } from "@fabkit/apps/fabble/types";

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

function byName(a: SearchEntry, b: SearchEntry): number {
	return a.name.localeCompare(b.name);
}

export function searchCards(
	index: SearchEntry[],
	query: string,
): SearchEntry[] {
	const normalizedQuery = normalizeCardName(query);
	if (normalizedQuery === "") return [];

	const startsWith: SearchEntry[] = [];
	const includes: SearchEntry[] = [];
	for (const entry of index) {
		if (entry.normalized.startsWith(normalizedQuery)) {
			startsWith.push(entry);
		} else if (entry.normalized.includes(normalizedQuery)) {
			includes.push(entry);
		}
	}
	startsWith.sort(byName);
	includes.sort(byName);

	return [...startsWith, ...includes].slice(0, MAX_SEARCH_RESULTS);
}
