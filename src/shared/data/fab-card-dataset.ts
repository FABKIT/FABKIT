import type { CardRarity } from "@fabkit/shared/config/cards/rarities";

/**
 * A slim summary of one real FAB card, built from the public dataset the
 * Fabble app also consumes (github.com/FABKIT/fabble-data, produced by
 * fabble-admin). Deliberately NOT the full FabbleCard shape (see
 * src/apps/fabble/types.ts) — apps can't import each other's types, and
 * consumers here only need enough to render a card face, not Fabble's
 * guessing-game fields (schedule, keywords, etc).
 *
 * Rainbow cards print the same name across multiple pitch colors with
 * different stats; the source dataset keeps the union in arrays
 * (pitches/costs/powers/defenses). This summary keeps only the first
 * printing's values — good enough for display, not for exact reproduction.
 */
export interface FabCard {
	id: string;
	name: string;
	rarity: CardRarity;
	imageUrl: string;
	pitch: 1 | 2 | 3 | null;
	cost: number | null;
	power: number | null;
	defense: number | null;
}

const DATASET_URL = "https://fabkit.github.io/fabble-data/v1/dataset.json";

/**
 * The dataset's rarity field never contains "token" or "marvel" (see
 * src/apps/fabble/types.ts's FabbleRarity — tokens aren't guessable trivia
 * answers, and Marvel is a treatment on an underlying card, not its own
 * rarity). Everything else lines up with CardRarity directly.
 */
const VALID_RARITIES = new Set<CardRarity>([
	"basic",
	"common",
	"rare",
	"superrare",
	"majestic",
	"legendary",
	"fabled",
	"promo",
]);

interface RawFabCard {
	id: string;
	name: string;
	rarity: string;
	imageUrl: string;
	pitches: number[];
	costs: (number | string)[];
	powers: (number | string)[];
	defenses: (number | string)[];
}

interface RawFabDataset {
	schemaVersion: number;
	cards: RawFabCard[];
}

function firstNumeric(values: (number | string)[]): number | null {
	const value = values[0];
	return typeof value === "number" ? value : null;
}

function toFabCard(raw: RawFabCard): FabCard | null {
	if (!VALID_RARITIES.has(raw.rarity as CardRarity) || !raw.imageUrl) {
		return null;
	}
	const pitch = raw.pitches[0];
	return {
		id: raw.id,
		name: raw.name,
		rarity: raw.rarity as CardRarity,
		imageUrl: raw.imageUrl,
		pitch: pitch === 1 || pitch === 2 || pitch === 3 ? pitch : null,
		cost: firstNumeric(raw.costs),
		power: firstNumeric(raw.powers),
		defense: firstNumeric(raw.defenses),
	};
}

let cardsByRarity: Partial<Record<CardRarity, FabCard[]>> | null = null;
let loadPromise: Promise<Partial<Record<CardRarity, FabCard[]>>> | null = null;

function groupByRarity(
	cards: FabCard[],
): Partial<Record<CardRarity, FabCard[]>> {
	const grouped: Partial<Record<CardRarity, FabCard[]>> = {};
	for (const card of cards) {
		if (!grouped[card.rarity]) grouped[card.rarity] = [];
		grouped[card.rarity]?.push(card);
	}
	return grouped;
}

/** Fetches and caches the real FAB card dataset, grouped by rarity. Safe to
 * call more than once — subsequent calls reuse the same in-flight/settled
 * promise. Call from a route loader so it's ready before it's needed. */
export function loadFabCardDataset(): Promise<
	Partial<Record<CardRarity, FabCard[]>>
> {
	if (cardsByRarity) return Promise.resolve(cardsByRarity);
	if (!loadPromise) {
		loadPromise = fetch(DATASET_URL)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`FAB card dataset fetch failed: ${response.status}`);
				}
				return response.json() as Promise<RawFabDataset>;
			})
			.then((data) => {
				const cards = data.cards
					.map(toFabCard)
					.filter((card): card is FabCard => card !== null);
				cardsByRarity = groupByRarity(cards);
				return cardsByRarity;
			});
	}
	return loadPromise;
}

/** Synchronous accessor — returns an empty array until loadFabCardDataset()
 * has resolved (or the rarity has no real cards, e.g. "token"/"marvel"). */
export function getFabCardsByRarity(rarity: CardRarity): FabCard[] {
	return cardsByRarity?.[rarity] ?? [];
}
