import type { SetPriceSnapshot } from "@fabkit/shared/data/fab-prices";
import { priceKey } from "@fabkit/shared/data/fab-prices";
import type {
	FabPrinting,
	FoilTreatment,
} from "@fabkit/shared/data/fab-printings";
import { fetchJson } from "./fetch-json";

/** Flesh and Blood's category id on tcgcsv/TCGplayer — verified against
 * live data. */
const TCGCSV_CATEGORY_ID = 62;
const TCGCSV_BASE = `https://tcgcsv.com/tcgplayer/${TCGCSV_CATEGORY_ID}`;

/** tcgcsv rejects requests with no identifying User-Agent. APP_VERSION
 * matches what pages.yml resolves at deploy time; local runs (no env var
 * set) just say "dev". */
const TCGCSV_USER_AGENT = `FABKIT/${process.env.APP_VERSION ?? "dev"} (+https://github.com/FABKIT/FABKIT)`;

function fetchTcgcsv<T>(path: string): Promise<T> {
	return fetchJson<T>(`${TCGCSV_BASE}${path}`, {
		headers: { "User-Agent": TCGCSV_USER_AGENT },
	});
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

/** Maps our own FoilTreatment vocabulary to TCGplayer's subtype names, so
 * the price snapshot can be keyed identically to how printings are already
 * keyed (see fab-prices.ts's priceKey). TCGplayer does not list Gold Cold
 * Foil as its own subtype (verified against multiple sets' live price
 * data) — the closest real listing is the plain Cold Foil one, which is
 * used here rather than showing no price at all for a treatment that, as
 * of this writing, the odds engine never actually draws (see
 * pack/generate-pack.ts) but the shader and types already model. */
const TCGCSV_SUBTYPE_BY_TREATMENT: Record<FoilTreatment, string> = {
	standard: "Normal",
	rainbow: "Rainbow Foil",
	cold: "Cold Foil",
	"gold-cold": "Cold Foil",
};

/** Resolves a set's tcgcsv group id — abbreviation AND exact name first,
 * then abbreviation alone, then exact name alone (neither alone is
 * reliable, but combined they resolve every known booster set). Returns
 * null (logged, not thrown) when nothing matches, so one set's tcgcsv
 * naming drifting must never fail the whole build — that set's prices are
 * simply unavailable until the mismatch is noticed and fixed.
 *
 * The both-fields pass exists for `IAR`, which tcgcsv lists twice: group
 * 24762 "Usurp the Shadow Throne" and 24776 "Usurp the Shadow Throne
 * Pre-release Cards" share the one abbreviation. Every other known set has
 * exactly one abbreviation match (verified against the live group list),
 * so this pass never changes their resolution — it only breaks IAR's tie
 * in favour of the group whose name is the exact one this app wants. */
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
	// Case-insensitively, because tcgcsv's own naming is not consistent:
	// its groups read "GEM Pack 1" through "GEM Pack 4" and then "Gem Pack
	// 5". An exact match would silently leave that one product with no
	// prices at all, which is the quietest possible way for this to break.
	const byName = groups.find((g) => g.name.toLowerCase() === wanted);
	if (byName) return byName;
	console.warn(
		`  ${code}: no tcgcsv group matched by abbreviation or exact name ("${setName}") — prices unavailable`,
	);
	return null;
}

/** The sealed booster pack/box products within a group, matched by
 * TCGplayer's own naming convention — "<Set Name> Booster Pack" for a
 * modern single-edition set, or "<Set Name> Booster Pack [Unlimited
 * Edition]" / "[1st Edition]" for an older set with more than one print
 * run (verified against live data for Arcane Rising). `setName` should be
 * the tcgcsv *group's* own name, not the-fab-cube's — the two disagree on
 * casing and wording often enough to matter (verified: TCGplayer's own
 * group is "Dusk till Dawn" but its own product is "Dusk Till Dawn";
 * the-fab-cube's "History Pack 1" vs TCGplayer's "History Pack Vol.1" is
 * worse still), and matching within one source's own naming is far more reliable
 * than matching across two. Still compared case-insensitively on top of
 * that, per the "Dusk Till/till Dawn" case.
 *
 * Deliberately anchored to `${base}` or `${base} [` rather than a
 * substring/`.includes()` check — "Booster Box" would otherwise also match
 * "Booster Box Case" (a case of boxes, a much bigger and differently-priced
 * product).
 *
 * Returned in preference order (exact name, then Unlimited, then 1st
 * Edition, then anything else), not narrowed to one product here — the
 * caller tries each in turn, because the "preferred" edition's own product
 * sometimes has no live market price at all (also verified for Arcane
 * Rising: its Unlimited Edition pack has none, while its 1st Edition pack
 * does) and falling through to a priced-but-less-preferred edition beats
 * showing no pack price whatsoever. */
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

/** Builds one set's price snapshot from its resolved tcgcsv group — sealed
 * pack/box market prices plus a market price per (tcgplayerProductId,
 * treatment) pair actually present in the set's own printings. Only
 * entries tcgcsv has a real market price for are written; everything else
 * is simply absent (see fab-prices.ts's SetPriceSnapshot doc comment). */
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
	// Sets with more than one historical print run (Alpha/1st Edition vs
	// Unlimited — see toSetMeta's own comment on this) don't carry a bare
	// "Normal" / "Cold Foil" / "Rainbow Foil" subtype at all; tcgcsv only
	// has "Unlimited Edition Cold Foil", "1st Edition Cold Foil", etc
	// (verified against live data for Arcane Rising). Prefer the plain
	// name when it exists, then Unlimited (the print still sold in current
	// boosters), then 1st Edition, rather than showing no price at all for
	// every card in these older sets.
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
