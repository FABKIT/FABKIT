import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { KNOWN_SETS } from "@fabkit/apps/pack-opener/config/known-sets";
import { REAL_SET_PACK_CONFIGS } from "@fabkit/apps/pack-opener/pack/set-configs";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import {
	type FabPrinting,
	type FabSetPrintings,
	type FoilTreatment,
	hasType,
	isClassCard,
	printingArtSlug,
	type SetIndexEntry,
} from "@fabkit/shared/data/fab-printings";
import {
	buildCardmarketSnapshot,
	type CardmarketCatalog,
	fetchCardmarketCatalog,
} from "./cardmarket";
import { bridgePrintings, PRE_RELEASE_SETS } from "./pre-release-bridge";
import type { RawCard, RawPrinting } from "./raw-card-data";
import {
	buildSetPriceSnapshot,
	fetchTcgcsvGroups,
	resolveGroup,
	type TcgcsvGroup,
} from "./tcgcsv";

/**
 * Builds the pack opener's per-set card and price data from the-fab-cube's
 * public dataset, tcgcsv.com's TCGplayer mirror (scripts/tcgcsv.ts) and
 * Cardmarket's daily catalogue (scripts/cardmarket.ts). A browser cannot
 * fetch the price sources itself, so they ship as build-time snapshots.
 *
 * Output (gitignored build output) under public/data/pack-opener/:
 *   sets/<CODE>.json, prices/<CODE>.json (tcgcsv), prices-cm/<CODE>.json
 *   (Cardmarket, euros), index.json (set list + metadata).
 *
 * Safe to run any time: `bun run build-pack-data`. Without data the app
 * degrades (a set with no price file shows no prices).
 */

/** All four files come from the-fab-cube's develop branch; main lags behind. */
const FAB_CUBE_JSON_PATH = "json/english";
const FAB_CUBE_RAW_BASE = `https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/develop/${FAB_CUBE_JSON_PATH}`;

function readFabCubeJson<T>(fileName: string): Promise<T> {
	return fetch(`${FAB_CUBE_RAW_BASE}/${fileName}`).then((r) => r.json());
}

const OUTPUT_DIR = join("public", "data", "pack-opener");

/** Real, checked-in artwork (not gitignored build output like OUTPUT_DIR
 * above) — see the README in that folder for the spec to upload to. */
const PACK_ART_DIR = join("public", "img", "pack-opener", "packs");

/** Numbered pack-front artworks for one set, in order, as public URLs; empty
 * when none are uploaded. Stops at the first gap in the numbering. */
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

/** Upstream sets that are several products under one code (GEM Packs), cut
 * by collector number. Ranges come from LSS's Card Vault API
 * (https://api.cardvault.fabtcg.com/carddb/api/v1/product-cards/gem-pack-1/).
 * splitOutputSets() fails the build if upstream has printings not covered
 * here. Names must match the TCGplayer group name (see resolveGroup). */
const SET_SPLITS: Record<
	string,
	ReadonlyArray<{
		code: string;
		name: string;
		/** ISO, to match the release dates the-fab-cube carries for whole
		 * sets, since both shapes end up in the same index. */
		releaseDate: string;
		/** Inclusive collector-number range, e.g. GEM001 to GEM032. */
		from: number;
		to: number;
	}>
> = {
	GEM: [
		{
			code: "GEM1",
			name: "GEM Pack 1",
			releaseDate: "2025-02-01T00:00:00.000Z",
			from: 1,
			to: 32,
		},
		{
			code: "GEM2",
			name: "GEM Pack 2",
			releaseDate: "2025-06-06T00:00:00.000Z",
			from: 33,
			to: 68,
		},
		{
			code: "GEM3",
			name: "GEM Pack 3",
			releaseDate: "2025-10-01T00:00:00.000Z",
			from: 69,
			to: 104,
		},
		{
			code: "GEM4",
			name: "GEM Pack 4",
			releaseDate: "2026-02-13T00:00:00.000Z",
			from: 105,
			to: 140,
		},
		{
			code: "GEM5",
			name: "GEM Pack 5",
			releaseDate: "2026-06-05T00:00:00.000Z",
			from: 141,
			to: 183,
		},
	],
};

/** One set as the APP sees it, which is usually one upstream set but can
 * be a slice of one (see SET_SPLITS). */
interface OutputSet {
	code: string;
	name: string;
	releaseDate: string | null;
	setLogo: string | null;
	productKind: SetIndexEntry["productKind"];
	printings: RawPrinting[];
}

/** The collector number inside a printing id ("GEM012" -> 12), or null
 * when the id is not shaped that way. */
function collectorNumber(printingId: string, setCode: string): number | null {
	const match = printingId.match(new RegExp(`^${setCode}(\\d+)`));
	return match ? Number(match[1]) : null;
}

/** Expands one included upstream set into the app-level sets it produces:
 * normally exactly itself, but a set listed in SET_SPLITS becomes several.
 *
 * Throws when a printing falls outside every range, which is how a newly
 * released GEM Pack announces itself: the fix is one more row in
 * SET_SPLITS, a wrapper-art folder, and a pack configuration. */
function splitOutputSets(
	code: string,
	meta: SetMeta,
	rawPrintings: RawPrinting[],
	productKind: SetIndexEntry["productKind"],
): OutputSet[] {
	const splits = SET_SPLITS[code];
	if (!splits) {
		return [
			{
				code,
				name: meta.name,
				releaseDate: meta.releaseDate,
				setLogo: meta.setLogo,
				productKind,
				printings: rawPrintings,
			},
		];
	}

	const unaccounted: string[] = [];
	const byCode = new Map(splits.map((s) => [s.code, [] as RawPrinting[]]));
	for (const printing of rawPrintings) {
		const number = collectorNumber(printing.id, code);
		const split =
			number === null
				? undefined
				: splits.find((s) => number >= s.from && number <= s.to);
		if (!split) {
			unaccounted.push(printing.id);
			continue;
		}
		byCode.get(split.code)?.push(printing);
	}

	if (unaccounted.length > 0) {
		const sample = [...new Set(unaccounted)].sort().slice(0, 10).join(", ");
		throw new Error(
			`${unaccounted.length} printing(s) in set "${code}" fall outside every ` +
				`range in SET_SPLITS (e.g. ${sample}).\n\n` +
				"This normally means a new product in that line has been released. " +
				"Add its range to SET_SPLITS in scripts/build-pack-data.ts, add a " +
				"pack configuration in src/apps/pack-opener/pack/set-configs.ts, and " +
				"create public/img/pack-opener/packs/<CODE>/ for its wrapper art.",
		);
	}

	return splits.map((split) => ({
		code: split.code,
		name: split.name,
		releaseDate: split.releaseDate,
		setLogo: meta.setLogo,
		productKind,
		printings: byCode.get(split.code) ?? [],
	}));
}

/** Hand-made set logos, for the sets Legend Story Studios' own data has
 * no logo for (also checked in, not build output). Same idea as
 * PACK_ART_DIR above: drop a file in, rebuild, done. */
const SET_LOGO_DIR = join("public", "img", "pack-opener", "logos");

/** The logo for one set: a checked-in file wins (fixes missing or unusable
 * upstream logos with no code change), else the card data's. */
async function resolveSetLogo(
	code: string,
	upstreamLogo: string | null,
): Promise<string | null> {
	const local = join(SET_LOGO_DIR, `${code}.webp`);
	try {
		await stat(local);
		return `/img/pack-opener/logos/${code}.webp`;
	} catch {
		return upstreamLogo;
	}
}

/** A booster-shaped candidate needs at least this many distinct printings.
 * Below this, small crossover/promo products would otherwise pass the "has
 * a Rainbow Foil" check too. */
const MIN_BOOSTER_PRINTING_COUNT = 50;

interface RawLookupEntry {
	id: string;
	description?: string;
	name?: string;
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

/** Builds a code -> value lookup from the-fab-cube's rarity.json / foiling.json.
 * Throws on unmapped upstream codes so the build fails loudly. */
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

/** Basename of a printing's artwork filename, extension stripped (".../SEA001-MV.webp" gives "SEA001-MV"). Null when upstream has no image_url. See printingImageUrl in fab-printings.ts. */
function toArtSlug(imageUrl: string | null | undefined): string | null {
	if (!imageUrl) return null;
	const filename = imageUrl.split("/").pop();
	if (!filename) return null;
	return filename.replace(/\.[a-zA-Z0-9]+$/, "");
}

interface SetMeta {
	code: string;
	name: string;
	releaseDate: string | null;
	setLogo: string | null;
}

/** Ends the artwork filename of a card's back face. */
const BACK_SUFFIX = "_BACK";

/**
 * Whether this artwork is the back of a physical card. Both sides are listed
 * as printings sharing a collector number; left in, a two-sided card would be
 * dealt twice as often. Read off the artwork filename because is_front is
 * unreliable and is_DFC is false on Marvel heroes with art on both sides.
 */
function isBackFace(artSlug: string | null): artSlug is string {
	return artSlug?.endsWith(BACK_SUFFIX) ?? false;
}

/**
 * The slug the other side of a card renders from, or null when there is none.
 *
 * Ordinary printings need is_DFC: most printings with double_sided_card_info
 * are separate cards sharing a print sheet. The slug is this printing's own
 * front slug plus "_BACK" (both faces share a collector number, and reading
 * the other face's image_url would pull in foil-baked art).
 *
 * A Marvel with art on both sides but is_DFC false uses its back row's linked
 * slug, only if it stays on the same collector number.
 */
function backSlugFor(
	raw: RawPrinting,
	frontSlug: string,
	isMarvel: boolean,
	backSlugByUniqueId: ReadonlyMap<string, string>,
	backSlugs: ReadonlySet<string>,
): string | null {
	const info = raw.double_sided_card_info;
	if (info?.some((entry) => entry.is_DFC && entry.other_face_unique_id)) {
		return `${frontSlug}${BACK_SUFFIX}`;
	}
	if (!isMarvel) return null;
	const linked = info
		?.map((entry) => backSlugByUniqueId.get(entry.other_face_unique_id))
		.find((slug) => slug?.startsWith(raw.id));
	if (linked) return linked;
	const sibling = `${frontSlug}${BACK_SUFFIX}`;
	return backSlugs.has(sibling) ? sibling : null;
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

/** The automatic derivation rule: released, plus at least
 * MIN_BOOSTER_PRINTING_COUNT distinct printings, plus at least one Rainbow
 * Foil printing. Verified against the real dataset to find 20 of 21 known
 * booster sets correctly (misses 1HP, wrongly admits a handful of Mastery
 * Pack / crossover products) — see known-sets.ts for how those are
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

/** The CI gate: every automatically-derived candidate must have a decision
 * recorded in known-sets.ts, so a newly released set can't ship, or be left
 * out, without someone deciding. An unrecognised candidate fails the build
 * with enough detail (name, release date, printing count) to write that
 * decision. Manual "include" entries in known-sets.ts (sets the automatic
 * rule structurally can't find, e.g. 1HP) are added on top, not filtered by
 * this check. */
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
	cardByUniqueId: Map<string, RawCard>,
): FabSetPrintings {
	const backSlugByUniqueId = new Map<string, string>();
	const frontRows: RawPrinting[] = [];
	for (const raw of rawPrintings) {
		const artSlug = toArtSlug(raw.image_url);
		if (isBackFace(artSlug)) backSlugByUniqueId.set(raw.unique_id, artSlug);
		else frontRows.push(raw);
	}
	const backSlugs = new Set(backSlugByUniqueId.values());
	const printings: FabPrinting[] = frontRows
		.map((raw): FabPrinting | null => {
			const card = cardByUniqueId.get(raw.unique_id);
			if (!card) {
				throw new Error(
					`No parent card found for printing ${raw.id} (${raw.unique_id})`,
				);
			}
			// An empty foiling or rarity is an upstream data-entry gap: skip the
			// printing. A new non-empty code still throws below.
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
			const artSlug = toArtSlug(raw.image_url);
			return {
				id: raw.id,
				uniqueId: raw.unique_id,
				name: card.name,
				rarity,
				foiling,
				edition: raw.edition ?? "N",
				expansionSlot: raw.expansion_slot,
				tcgplayerProductId: raw.tcgplayer_product_id || null,
				pitch: toPitch(card.pitch),
				cost: toNumberOrNull(card.cost),
				power: toNumberOrNull(card.power),
				defense: toNumberOrNull(card.defense),
				types: card.types,
				artVariations: raw.art_variations ?? [],
				artSlug,
				backSlug: backSlugFor(
					raw,
					printingArtSlug({ id: raw.id, rarity, artSlug }),
					rarity === "marvel",
					backSlugByUniqueId,
					backSlugs,
				),
			};
		})
		.filter((printing): printing is FabPrinting => printing !== null)
		.sort((a, b) => a.id.localeCompare(b.id));

	return { code, printings };
}

/** Throws if a pack slot of a real set has no printing to deal. */
function assertPackSlotsDealable(setPrintings: FabSetPrintings) {
	const config = REAL_SET_PACK_CONFIGS[setPrintings.code];
	if (!config) return;
	const hasPool = (
		rarity: CardRarity,
		expansionSlot: boolean,
		requiresType?: string,
		classRestricted?: boolean,
	) =>
		setPrintings.printings.some(
			(p) =>
				p.rarity === rarity &&
				p.expansionSlot === expansionSlot &&
				(!requiresType || hasType(p, requiresType)) &&
				(classRestricted === undefined || isClassCard(p) === classRestricted),
		);
	const empty: string[] = [];
	for (const slot of config.slots) {
		for (const entry of slot.rarityTable) {
			if (
				!hasPool(
					entry.rarity,
					Boolean(entry.expansionSlot),
					entry.requiresType,
					entry.classRestricted,
				)
			) {
				empty.push(`slot "${slot.kind}" -> rarity "${entry.rarity}"`);
			}
		}
	}
	for (const [rarity, chance] of [
		["marvel", config.marvelChance],
		["fabled", config.fabledChance],
	] as const) {
		if (chance > 0 && !hasPool(rarity, false)) {
			empty.push(`${rarity}Chance is ${chance} but the set prints none`);
		}
	}
	if (empty.length > 0) {
		throw new Error(
			`${setPrintings.code}: pack slots that can't be dealt: ${empty.join("; ")}`,
		);
	}
}

async function main() {
	console.log("Fetching the-fab-cube dataset...");
	const [cards, sets, rarityLookup, foilingLookup] = await Promise.all([
		readFabCubeJson<RawCard[]>("card.json"),
		readFabCubeJson<RawSet[]>("set.json"),
		readFabCubeJson<RawLookupEntry[]>("rarity.json"),
		readFabCubeJson<RawLookupEntry[]>("foiling.json"),
	]);

	// Fail loudly if upstream adds a code this script doesn't know about,
	// rather than silently mis-mapping or dropping printings.
	buildLookup(rarityLookup, RARITY_BY_CODE);
	buildLookup(foilingLookup, FOILING_BY_CODE);

	console.log(`${cards.length} cards, ${sets.length} set entries.`);

	const printingsBySetCode = new Map<string, RawPrinting[]>();
	// Keyed by unique_id: both sides of a double-faced card share a collector id.
	const cardByUniqueId = new Map<string, RawCard>();
	for (const card of cards) {
		for (const printing of card.printings) {
			cardByUniqueId.set(printing.unique_id, card);
			const list = printingsBySetCode.get(printing.set_id);
			if (list) {
				list.push(printing);
			} else {
				printingsBySetCode.set(printing.set_id, [printing]);
			}
		}
	}

	const setMetaByCode = new Map(sets.map((s) => [s.id, toSetMeta(s)]));

	// Pre-release bridge — see PRE_RELEASE_SETS's own comment. Only takes
	// over a set's printings/metadata while card.json's own count for that
	// code is still behind the bridge's; steps out of the way (and says so)
	// the moment the-fab-cube catches up.
	for (const [code, entry] of Object.entries(PRE_RELEASE_SETS)) {
		const upstreamCount = printingsBySetCode.get(code)?.length ?? 0;
		const bridged = bridgePrintings(code, entry);
		if (upstreamCount >= bridged.printings.length) {
			console.log(
				`  ${code}: card.json now carries ${upstreamCount} printing(s) ` +
					`(bridge has ${bridged.printings.length}) — the PRE_RELEASE_SETS entry ` +
					"in scripts/pre-release-bridge.ts is no longer needed and can be removed",
			);
			continue;
		}
		console.log(
			`  ${code}: bridging ${bridged.printings.length} printing(s) from ` +
				`@flesh-and-blood/cards (card.json only has ${upstreamCount})`,
		);
		printingsBySetCode.set(code, bridged.printings);
		for (const card of bridged.cards) {
			for (const printing of card.printings) {
				cardByUniqueId.set(printing.unique_id, card);
			}
		}
		setMetaByCode.set(code, {
			code,
			name: entry.name,
			releaseDate: entry.releaseDate,
			// LSS's own data carries no logo for this set yet; resolveSetLogo's
			// checked-in-file override supplies one.
			setLogo: null,
		});
	}

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
	await mkdir(join(OUTPUT_DIR, "prices"), { recursive: true });
	await mkdir(join(OUTPUT_DIR, "prices-cm"), { recursive: true });

	// Cardmarket's two daily files, fetched once for every set. A failure
	// here must not fail the build: euro prices are an addition to the
	// dollar ones, so losing them for a deploy is a degrade, not a break.
	console.log("Fetching Cardmarket catalogue...");
	let cardmarket: CardmarketCatalog | null = null;
	try {
		cardmarket = await fetchCardmarketCatalog();
		console.log(
			`  Cardmarket catalogue of ${cardmarket.priceByProduct.size} priced products, updated ${cardmarket.sourceUpdatedAt}`,
		);
	} catch (error) {
		console.warn(
			`  Cardmarket fetch failed (${error instanceof Error ? error.message : error}) — euro prices unavailable this build`,
		);
	}

	// Same policy as Cardmarket above, and as the per-set price fetch below:
	// losing prices for a deploy is a degrade, not a break.
	console.log("Fetching tcgcsv group list...");
	let groups: TcgcsvGroup[] = [];
	try {
		groups = await fetchTcgcsvGroups();
	} catch (error) {
		console.warn(
			`  tcgcsv group list fetch failed (${error instanceof Error ? error.message : error}) — dollar prices unavailable this build`,
		);
	}

	const indexEntries: SetIndexEntry[] = [];

	const outputSets = includedCodes.flatMap((code) => {
		const meta = setMetaByCode.get(code);
		if (!meta) {
			throw new Error(`No set metadata found for included code "${code}"`);
		}
		return splitOutputSets(
			code,
			meta,
			printingsBySetCode.get(code) ?? [],
			KNOWN_SETS.find((decision) => decision.code === code)?.kind ??
				"booster-set",
		);
	});

	for (const output of outputSets) {
		const code = output.code;
		const setPrintings = buildSetPrintings(
			code,
			output.printings,
			cardByUniqueId,
		);
		assertPackSlotsDealable(setPrintings);
		await writeFile(
			join(OUTPUT_DIR, "sets", `${code}.json`),
			JSON.stringify(setPrintings),
			"utf-8",
		);
		const packArt = await resolvePackArt(code);
		indexEntries.push({
			code,
			name: output.name,
			releaseDate: output.releaseDate,
			setLogo: await resolveSetLogo(code, output.setLogo),
			printingCount: setPrintings.printings.length,
			productKind: output.productKind,
			packArt,
		});

		const group =
			groups.length > 0 ? resolveGroup(code, output.name, groups) : null;
		let priceLogSuffix = "no prices";
		// Kept for the Cardmarket build below, which scores candidate
		// expansions by how well their euros agree with these dollars.
		let tcgCardPrices: Record<string, number> = {};
		if (group !== null) {
			try {
				const snapshot = await buildSetPriceSnapshot(
					group.groupId,
					group.name,
					setPrintings.printings,
				);
				await writeFile(
					join(OUTPUT_DIR, "prices", `${code}.json`),
					JSON.stringify(snapshot),
					"utf-8",
				);
				tcgCardPrices = snapshot.cardPrices;
				priceLogSuffix = `${Object.keys(snapshot.cardPrices).length} card prices`;
			} catch (error) {
				// A price fetch failing must not fail the whole build (or drop a
				// set's card/art data, already written above) — that set's cards
				// just show no price this deploy, same degrade as no group match.
				console.warn(
					`  ${code}: price fetch failed (${error instanceof Error ? error.message : error})`,
				);
				priceLogSuffix = "price fetch failed";
			}
		}

		// Euro prices. Deliberately after the dollar ones, which it uses to
		// tell 1st Edition and Unlimited listings apart — see cardmarket.ts's
		// chooseExpansion.
		let cardmarketLogSuffix = "";
		if (cardmarket) {
			const { snapshot, coverage } = buildCardmarketSnapshot(
				code,
				setPrintings.printings,
				tcgCardPrices,
				cardmarket,
			);
			await writeFile(
				join(OUTPUT_DIR, "prices-cm", `${code}.json`),
				JSON.stringify(snapshot),
				"utf-8",
			);
			const pct =
				coverage.versions > 0
					? Math.round((100 * coverage.priced) / coverage.versions)
					: 0;
			cardmarketLogSuffix =
				`, EUR ${coverage.priced}/${coverage.versions} versions (${pct}%` +
				(coverage.ambiguous > 0 ? `, ${coverage.ambiguous} ambiguous` : "") +
				(coverage.refinedPairings > 0
					? `, ${coverage.refinedPairings} refined`
					: "") +
				(coverage.edition !== null ? `, ${coverage.edition} run` : "") +
				(coverage.ratio !== null
					? `, EUR/USD ${coverage.ratio.toFixed(2)}`
					: "") +
				(snapshot.packPrice !== null
					? `, pack EUR ${snapshot.packPrice.toFixed(2)}`
					: ", no EUR pack price") +
				")";
		}

		console.log(
			`  ${code}: ${setPrintings.printings.length} printings, ${packArt.length} pack artwork(s), ${priceLogSuffix}${cardmarketLogSuffix}`,
		);
	}

	indexEntries.sort((a, b) => {
		// Booster sets first, then supplementary products.
		if (a.productKind !== b.productKind) {
			return a.productKind === "booster-set" ? -1 : 1;
		}
		// Booster sets go in release order, the way people talk about them.
		if (a.productKind === "booster-set") {
			return (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "");
		}
		// Supplementary products go by name so a product line stays together;
		// numeric collation puts GEM Pack 10 after 9.
		return a.name.localeCompare(b.name, "en", { numeric: true });
	});

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
