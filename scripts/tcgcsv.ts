import type { SetPriceSnapshot } from "@fabkit/shared/data/fab-prices";
import { priceKey } from "@fabkit/shared/data/fab-prices";
import type {
	FabPrinting,
	FoilTreatment,
} from "@fabkit/shared/data/fab-printings";

/** Flesh and Blood's category id on tcgcsv/TCGplayer. */
const TCGCSV_CATEGORY_ID = 62;
const TCGCSV_BASE = `https://tcgcsv.com/tcgplayer/${TCGCSV_CATEGORY_ID}`;

/** tcgcsv rejects requests with no identifying User-Agent. */
const TCGCSV_USER_AGENT = `FABKIT/${process.env.APP_VERSION ?? "dev"} (+https://github.com/FABKIT/FABKIT)`;

function fetchTcgcsv<T>(path: string): Promise<T> {
	return fetch(`${TCGCSV_BASE}${path}`, {
		headers: { "User-Agent": TCGCSV_USER_AGENT },
	}).then((r) => r.json());
}

export interface TcgcsvGroup {
	groupId: number;
	name: string;
	abbreviation: string;
}

export async function fetchTcgcsvGroups(): Promise<TcgcsvGroup[]> {
	const groups = await fetchTcgcsv<{ results: TcgcsvGroup[] }>("/groups");
	return groups.results;
}

interface TcgcsvProduct {
	productId: number;
	name: string;
}

interface TcgcsvPriceRow {
	productId: number;
	marketPrice: number | null;
	subTypeName: string;
}

/** Maps our FoilTreatment to TCGplayer's subtype names. TCGplayer has no
 * Gold Cold Foil subtype, so it uses the Cold Foil price. */
const TCGCSV_SUBTYPE_BY_TREATMENT: Record<FoilTreatment, string> = {
	standard: "Normal",
	rainbow: "Rainbow Foil",
	cold: "Cold Foil",
	"gold-cold": "Cold Foil",
};

/** Resolves a set's tcgcsv group id: abbreviation and name together, then
 * abbreviation, then name. The first pass breaks `IAR`'s tie between two
 * groups sharing one abbreviation. Returns null (logged, not thrown) when
 * nothing matches, so one set's naming drift never fails the build. */
export function resolveGroup(
	code: string,
	setName: string,
	groups: TcgcsvGroup[],
): TcgcsvGroup | null {
	const wanted = setName.toLowerCase();
	const byBoth = groups.find(
		(g) => g.abbreviation === code && g.name.toLowerCase() === wanted,
	);
	if (byBoth) return byBoth;
	const byAbbreviation = groups.find((g) => g.abbreviation === code);
	if (byAbbreviation) return byAbbreviation;
	// Case-insensitive: tcgcsv writes "GEM Pack 4" but "Gem Pack 5".
	const byName = groups.find((g) => g.name.toLowerCase() === wanted);
	if (byName) return byName;
	console.warn(
		`  ${code}: no tcgcsv group matched by abbreviation or exact name ("${setName}") — prices unavailable`,
	);
	return null;
}

/** The sealed booster pack/box products within a group, named
 * "<Set Name> Booster Pack" with an optional "[Unlimited Edition]" or
 * "[1st Edition]" suffix. `setName` should be the tcgcsv group's own name,
 * compared case-insensitively. Anchored to `${base}` or `${base} [` so that
 * "Booster Box Case" does not match. Returned in preference order (exact,
 * Unlimited, 1st Edition) because the preferred product sometimes has no
 * market price and the caller falls through to the next. */
function findSealedProductCandidates(
	products: TcgcsvProduct[],
	setName: string,
	kind: "Booster Pack" | "Booster Box",
): TcgcsvProduct[] {
	const base = `${setName} ${kind}`.toLowerCase();
	const candidates = products.filter((p) => {
		const name = p.name.toLowerCase();
		return name === base || name.startsWith(`${base} [`);
	});
	const rank = (p: TcgcsvProduct): number => {
		const name = p.name.toLowerCase();
		if (name === base) return 0;
		if (name.includes("[unlimited edition]")) return 1;
		if (name.includes("[1st edition]")) return 2;
		return 3;
	};
	return [...candidates].sort((a, b) => rank(a) - rank(b));
}

/** Builds one set's price snapshot: sealed pack/box market prices plus a
 * market price per (tcgplayerProductId, treatment) pair. Entries without a
 * market price are left out. */
export async function buildSetPriceSnapshot(
	groupId: number,
	setName: string,
	printings: FabPrinting[],
): Promise<SetPriceSnapshot> {
	const [products, prices] = await Promise.all([
		fetchTcgcsv<{ results: TcgcsvProduct[] }>(`/${groupId}/products`),
		fetchTcgcsv<{ results: TcgcsvPriceRow[] }>(`/${groupId}/prices`),
	]);

	const priceByProductAndSubtype = new Map<string, number>();
	for (const row of prices.results) {
		if (row.marketPrice === null) continue;
		priceByProductAndSubtype.set(
			`${row.productId}:${row.subTypeName}`,
			row.marketPrice,
		);
	}
	// Older sets only have edition-prefixed subtypes ("Unlimited Edition
	// Cold Foil"); prefer the plain name, then Unlimited, then 1st Edition.
	const EDITION_PREFIXES = ["", "Unlimited Edition ", "1st Edition "];
	function marketPriceFor(
		productId: number,
		subTypeName: string,
	): number | null {
		for (const prefix of EDITION_PREFIXES) {
			const price = priceByProductAndSubtype.get(
				`${productId}:${prefix}${subTypeName}`,
			);
			if (price !== undefined) return price;
		}
		return null;
	}

	function bestSealedPrice(candidates: TcgcsvProduct[]): number | null {
		for (const candidate of candidates) {
			const price = marketPriceFor(candidate.productId, "Normal");
			if (price !== null) return price;
		}
		return null;
	}

	const cardPrices: Record<string, number> = {};
	for (const printing of printings) {
		if (!printing.tcgplayerProductId) continue;
		const subType = TCGCSV_SUBTYPE_BY_TREATMENT[printing.foiling];
		const price = marketPriceFor(Number(printing.tcgplayerProductId), subType);
		if (price === null) continue;
		cardPrices[priceKey(printing.tcgplayerProductId, printing.foiling)] = price;
	}

	return {
		capturedAt: new Date().toISOString(),
		packMarketPrice: bestSealedPrice(
			findSealedProductCandidates(products.results, setName, "Booster Pack"),
		),
		boxMarketPrice: bestSealedPrice(
			findSealedProductCandidates(products.results, setName, "Booster Box"),
		),
		cardPrices,
	};
}
