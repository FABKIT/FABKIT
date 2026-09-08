import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { KNOWN_SETS } from "@fabkit/apps/pack-opener/config/known-sets";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type {
	FabPrinting,
	FabSetPrintings,
	FoilTreatment,
} from "@fabkit/shared/data/fab-printings";

/**
 * Builds the pack opener's per-set card data from the-fab-cube's public
 * dataset. See the execution plan (D:\Desktop\pack-opener-execution-plan.md,
 * outside the repo), sections 2.2, 5.1 and 8, for the full reasoning.
 *
 * Output (gitignored — build output, not source, see .gitignore):
 *   public/data/pack-opener/sets/<CODE>.json   one file per included set
 *   public/data/pack-opener/index.json         set list + metadata
 *
 * Deliberately does NOT fetch prices yet (tcgcsv.com) — that lands with the
 * CI wiring in a later commit (see the plan's commit table, item 10). This
 * script is safe to run locally any time: `bun run build-pack-data`. A
 * fresh checkout without ever having run it just has no pack-opener data
 * yet; nothing else in the repo depends on these files existing until the
 * pack opener actually switches its card resolver over to fab-printings.ts.
 */

const CARD_JSON_URL =
	"https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/card.json";
const SET_JSON_URL =
	"https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/set.json";
const RARITY_JSON_URL =
	"https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/rarity.json";
const FOILING_JSON_URL =
	"https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/foiling.json";

const OUTPUT_DIR = join("public", "data", "pack-opener");

/** Real, checked-in artwork (not gitignored build output like OUTPUT_DIR
 * above) — see the execution plan, section 7.1, for the exact spec the
 * product owner uploads to. */
const PACK_ART_DIR = join("public", "img", "pack-opener", "packs");

/** Numbered pack-front artworks for one set, in order, as public URLs —
 * or an empty array when nothing's been uploaded for it yet (the normal
 * case for most sets today; see fab-printings.ts's SetIndexEntry.packArt
 * for how the app degrades when this is empty). Stops at the first gap in
 * the numbering rather than requiring a strict contiguous set, so a
 * mis-numbered upload degrades to "fewer artworks found" instead of
 * silently discarding everything after the gap. */
async function resolvePackArt(code: string): Promise<string[]> {
	let entries: string[];
	try {
		entries = await readdir(join(PACK_ART_DIR, code));
	} catch {
		return [];
	}

	const numbers = entries
		.map((name) => name.match(/^(\d+)\.webp$/)?.[1])
		.filter((n): n is string => n !== undefined)
		.map(Number)
		.sort((a, b) => a - b);

	const urls: string[] = [];
	for (let expected = 1; numbers.includes(expected); expected++) {
		urls.push(`/img/pack-opener/packs/${code}/${expected}.webp`);
	}
	return urls;
}

/** A booster-shaped candidate needs at least this many distinct printings
 * (see the plan, section 8.3, rule 2). Below this, small crossover/promo
 * products would otherwise pass the "has a Rainbow Foil" check too. */
const MIN_BOOSTER_PRINTING_COUNT = 50;

interface RawLookupEntry {
	id: string;
	description?: string;
	name?: string;
}

interface RawPrinting {
	id: string;
	set_id: string;
	rarity: string;
	foiling: string;
	expansion_slot: boolean;
	tcgplayer_product_id: string | null;
}

interface RawCard {
	name: string;
	pitch: string;
	cost: string;
	power: string;
	defense: string;
	types: string[];
	printings: RawPrinting[];
}

interface RawSetPrinting {
	initial_release_date: string | null;
	set_logo: string | null;
}

interface RawSet {
	id: string;
	name: string;
	printings: RawSetPrinting[];
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Fetch failed for ${url}: ${response.status}`);
	}
	return response.json() as Promise<T>;
}

/** Builds a code -> value lookup from the-fab-cube's own rarity.json /
 * foiling.json, per Appendix A.4 ("use them rather than hardcoding the
 * single-letter codes"). Throwing here (rather than falling back to some
 * default) is deliberate: if upstream ever adds a rarity or foiling code
 * this doesn't know how to map, that must fail the build loudly rather
 * than silently mis-map or drop printings. */
function buildLookup<T extends string>(
	entries: RawLookupEntry[],
	valuesByCode: Record<string, T>,
): Record<string, T> {
	const lookup: Record<string, T> = {};
	for (const entry of entries) {
		const mapped = valuesByCode[entry.id];
		if (!mapped) {
			throw new Error(
				`Unmapped upstream code "${entry.id}" (${entry.description ?? entry.name}). ` +
					"Add it to the mapping table in scripts/build-pack-data.ts before rebuilding.",
			);
		}
		lookup[entry.id] = mapped;
	}
	return lookup;
}

/** the-fab-cube's rarity.json carries exactly these 10 codes today, which
 * map 1:1 onto CardRarity's 10 keys — see src/shared/config/cards/rarities.ts. */
const RARITY_BY_CODE: Record<string, CardRarity> = {
	C: "common",
	R: "rare",
	S: "superrare",
	M: "majestic",
	L: "legendary",
	F: "fabled",
	T: "token",
	B: "basic",
	V: "marvel",
	P: "promo",
};

const FOILING_BY_CODE: Record<string, FoilTreatment> = {
	S: "standard",
	R: "rainbow",
	C: "cold",
	G: "gold-cold",
};

function toNumberOrNull(value: string): number | null {
	if (value === "") return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function toPitch(value: string): 1 | 2 | 3 | null {
	const parsed = toNumberOrNull(value);
	return parsed === 1 || parsed === 2 || parsed === 3 ? parsed : null;
}

interface SetMeta {
	code: string;
	name: string;
	releaseDate: string | null;
	setLogo: string | null;
}

/** One set can carry more than one `printings` entry in set.json (distinct
 * editions with distinct release dates, e.g. Alpha vs Unlimited). Use the
 * earliest release date, and the logo attached to that same entry, falling
 * back to any entry that does carry a logo. */
function toSetMeta(raw: RawSet): SetMeta {
	const dated = raw.printings
		.filter((p): p is RawSetPrinting & { initial_release_date: string } =>
			Boolean(p.initial_release_date),
		)
		.sort((a, b) =>
			a.initial_release_date.localeCompare(b.initial_release_date),
		);
	const earliest = dated[0];
	const logo =
		earliest?.set_logo ??
		raw.printings.find((p) => p.set_logo)?.set_logo ??
		null;
	return {
		code: raw.id,
		name: raw.name,
		releaseDate: earliest?.initial_release_date ?? null,
		setLogo: logo,
	};
}

interface Candidate {
	code: string;
	name: string;
	releaseDate: string;
	printingCount: number;
}

/** The automatic derivation rule from the plan, section 8.3: released, plus
 * at least MIN_BOOSTER_PRINTING_COUNT distinct printings, plus at least one
 * Rainbow Foil printing. Verified against the real dataset to find 20 of 21
 * known booster sets correctly (misses 1HP, wrongly admits a handful of
 * Mastery Pack / crossover products) — see known-sets.ts for how those are
 * corrected. This function only proposes candidates; known-sets.ts and the
 * caller decide what actually ships. */
function deriveCandidates(
	printingsBySetCode: Map<string, RawPrinting[]>,
	setMetaByCode: Map<string, SetMeta>,
	now: Date,
): Candidate[] {
	const candidates: Candidate[] = [];
	for (const [code, printings] of printingsBySetCode) {
		if (printings.length < MIN_BOOSTER_PRINTING_COUNT) continue;
		if (!printings.some((p) => p.foiling === "R")) continue;
		const meta = setMetaByCode.get(code);
		if (!meta?.releaseDate) continue;
		if (new Date(meta.releaseDate) > now) continue;
		candidates.push({
			code,
			name: meta.name,
			releaseDate: meta.releaseDate,
			printingCount: printings.length,
		});
	}
	return candidates.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
}

/** The CI gate from the plan, section 8.5: every automatically-derived
 * candidate must have a decision recorded in known-sets.ts. An unrecognised
 * candidate fails the build with enough detail (name, release date,
 * printing count) to write that decision. Manual "include" entries in
 * known-sets.ts (sets the automatic rule structurally can't find, e.g.
 * 1HP) are added on top, not filtered by this check. */
function resolveIncludedSetCodes(candidates: Candidate[]): string[] {
	const decisionByCode = new Map(KNOWN_SETS.map((d) => [d.code, d]));

	const unknown = candidates.filter((c) => !decisionByCode.has(c.code));
	if (unknown.length > 0) {
		const details = unknown
			.map(
				(c) =>
					`  - ${c.code}: "${c.name}", released ${c.releaseDate}, ${c.printingCount} printings`,
			)
			.join("\n");
		throw new Error(
			`Found ${unknown.length} set code(s) with no decision in ` +
				`src/apps/pack-opener/config/known-sets.ts:\n${details}\n\n` +
				'Add an "include" or "exclude" entry with a reason for each, then rebuild.',
		);
	}

	const included = new Set<string>();
	for (const candidate of candidates) {
		if (decisionByCode.get(candidate.code)?.decision === "include") {
			included.add(candidate.code);
		}
	}
	// Manual overrides: known-sets.ts can also include a code the automatic
	// rule never surfaced as a candidate at all (1HP has no Rainbow Foil
	// printing, so it never becomes a candidate above).
	for (const decision of KNOWN_SETS) {
		if (decision.decision === "include") included.add(decision.code);
	}
	return [...included].sort();
}

function buildSetPrintings(
	code: string,
	rawPrintings: RawPrinting[],
	cardByPrintingId: Map<string, RawCard>,
): FabSetPrintings {
	const printings: FabPrinting[] = rawPrintings
		.map((raw): FabPrinting | null => {
			const card = cardByPrintingId.get(raw.id);
			if (!card) {
				throw new Error(`No parent card found for printing ${raw.id}`);
			}
			// A handful of upstream printings (6, as of this writing, e.g.
			// PEN078) carry an empty foiling or rarity string rather than a
			// real code — an upstream data-entry gap, not a new code this
			// script doesn't know about. Drop just that printing rather than
			// failing the whole build; a genuinely new non-empty code still
			// throws below, which is the real "unmapped code" case.
			if (!raw.foiling || !raw.rarity) {
				console.warn(
					`  Skipping ${raw.id}: missing rarity or foiling code in upstream data ` +
						`(rarity="${raw.rarity}", foiling="${raw.foiling}")`,
				);
				return null;
			}
			const rarity = RARITY_BY_CODE[raw.rarity];
			const foiling = FOILING_BY_CODE[raw.foiling];
			if (!rarity) {
				throw new Error(`Unmapped rarity code "${raw.rarity}" on ${raw.id}`);
			}
			if (!foiling) {
				throw new Error(`Unmapped foiling code "${raw.foiling}" on ${raw.id}`);
			}
			return {
				id: raw.id,
				name: card.name,
				rarity,
				foiling,
				expansionSlot: raw.expansion_slot,
				tcgplayerProductId: raw.tcgplayer_product_id || null,
				pitch: toPitch(card.pitch),
				cost: toNumberOrNull(card.cost),
				power: toNumberOrNull(card.power),
				defense: toNumberOrNull(card.defense),
				types: card.types,
			};
		})
		.filter((printing): printing is FabPrinting => printing !== null)
		.sort((a, b) => a.id.localeCompare(b.id));

	return { code, printings };
}

async function main() {
	console.log("Fetching the-fab-cube dataset...");
	const [cards, sets, rarityLookup, foilingLookup] = await Promise.all([
		fetchJson<RawCard[]>(CARD_JSON_URL),
		fetchJson<RawSet[]>(SET_JSON_URL),
		fetchJson<RawLookupEntry[]>(RARITY_JSON_URL),
		fetchJson<RawLookupEntry[]>(FOILING_JSON_URL),
	]);

	// Fail loudly if upstream adds a code this script doesn't know about,
	// rather than silently mis-mapping or dropping printings.
	buildLookup(rarityLookup, RARITY_BY_CODE);
	buildLookup(foilingLookup, FOILING_BY_CODE);

	console.log(`${cards.length} cards, ${sets.length} set entries.`);

	const printingsBySetCode = new Map<string, RawPrinting[]>();
	const cardByPrintingId = new Map<string, RawCard>();
	for (const card of cards) {
		for (const printing of card.printings) {
			cardByPrintingId.set(printing.id, card);
			const list = printingsBySetCode.get(printing.set_id);
			if (list) {
				list.push(printing);
			} else {
				printingsBySetCode.set(printing.set_id, [printing]);
			}
		}
	}

	const setMetaByCode = new Map(sets.map((s) => [s.id, toSetMeta(s)]));

	const candidates = deriveCandidates(
		printingsBySetCode,
		setMetaByCode,
		new Date(),
	);
	const includedCodes = resolveIncludedSetCodes(candidates);

	console.log(
		`Including ${includedCodes.length} set(s): ${includedCodes.join(", ")}`,
	);

	await mkdir(join(OUTPUT_DIR, "sets"), { recursive: true });

	const indexEntries: Array<{
		code: string;
		name: string;
		releaseDate: string | null;
		setLogo: string | null;
		printingCount: number;
		packArt: string[];
	}> = [];

	for (const code of includedCodes) {
		const rawPrintings = printingsBySetCode.get(code) ?? [];
		const meta = setMetaByCode.get(code);
		if (!meta) {
			throw new Error(`No set metadata found for included code "${code}"`);
		}
		const setPrintings = buildSetPrintings(
			code,
			rawPrintings,
			cardByPrintingId,
		);
		await writeFile(
			join(OUTPUT_DIR, "sets", `${code}.json`),
			JSON.stringify(setPrintings),
			"utf-8",
		);
		const packArt = await resolvePackArt(code);
		indexEntries.push({
			code,
			name: meta.name,
			releaseDate: meta.releaseDate,
			setLogo: meta.setLogo,
			printingCount: setPrintings.printings.length,
			packArt,
		});
		console.log(
			`  ${code}: ${setPrintings.printings.length} printings, ${packArt.length} pack artwork(s)`,
		);
	}

	indexEntries.sort((a, b) =>
		(a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""),
	);

	await writeFile(
		join(OUTPUT_DIR, "index.json"),
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				sets: indexEntries,
			},
			null,
			"\t",
		),
		"utf-8",
	);

	console.log("Done.");
}

main().catch((error) => {
	console.error("Error:", error instanceof Error ? error.message : error);
	process.exit(1);
});
