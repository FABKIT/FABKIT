import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type {
	FabPrinting,
	FabSetPrintings,
} from "@fabkit/shared/data/fab-printings";

const DATA_DIR = join(process.cwd(), "public", "data", "pack-opener");

/** Whether the generated pack data these tests read is present. index.json is
 * written last by scripts/build-pack-data.ts, so it marks a finished build.
 * Missing data skips the test locally with instructions, but fails outright in
 * CI, where the data step has run and a missing file means a real break. */
export function hasPackData(): boolean {
	const present = existsSync(join(DATA_DIR, "index.json"));
	if (present) return true;
	if (process.env.CI) {
		throw new Error(
			"Generated pack data is missing; CI should have built it with `bun run build-pack-data`.",
		);
	}
	console.warn(
		"Skipping tests that need generated pack data. Run `bun run build-pack-data` to include them.",
	);
	return false;
}

/** Reads a set's generated JSON directly from disk rather than through
 * shared/data/fab-printings.ts's loadSetPrintings(), which fetches over HTTP and
 * assumes a browser origin. */
export function readGeneratedSet(code: string): FabSetPrintings {
	const raw = readFileSync(join(DATA_DIR, "sets", `${code}.json`), "utf-8");
	return JSON.parse(raw) as FabSetPrintings;
}

export function makePrinting(
	overrides: Partial<FabPrinting> = {},
): FabPrinting {
	return {
		id: "TST001",
		uniqueId: "test-unique-id",
		name: "Test Card",
		rarity: "common",
		foiling: "standard",
		edition: "N",
		expansionSlot: false,
		tcgplayerProductId: null,
		pitch: null,
		cost: null,
		power: null,
		defense: null,
		types: [],
		artVariations: [],
		artSlug: null,
		backSlug: null,
		...overrides,
	};
}

export function makeDrawn(overrides: Partial<DrawnCard> = {}): DrawnCard {
	return {
		id: "test-drawn",
		slot: "common",
		rarity: "common",
		treatment: "standard",
		expansionSlot: false,
		...overrides,
	};
}
