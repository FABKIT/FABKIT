import dataset from "../../../public/fabble-sample-data.json";
import type { FabbleCard } from "../../../src/apps/fabble/types";

export const fabbleDataset = dataset as unknown as typeof dataset & {
	cards: FabbleCard[];
};

export function makeCard(overrides: Partial<FabbleCard>): FabbleCard {
	return {
		id: "test-card",
		name: "Test Card",
		type: "action",
		classes: [],
		talents: [],
		pitches: [],
		costs: [],
		powers: [],
		defenses: [],
		life: null,
		subtypes: [],
		keywords: [],
		sets: [{ code: "WTR", name: "Welcome to Rathe", order: 0 }],
		rarity: "common",
		artist: "Test Artist",
		imageUrl: "https://example.com/image.png",
		thumbnailUrl: "https://example.com/thumb.png",
		...overrides,
	};
}
