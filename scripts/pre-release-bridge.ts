import { cards as bridgeCards } from "@flesh-and-blood/cards";
import {
	Class as BridgeClass,
	Foiling as BridgeFoiling,
	type Printing as BridgePrinting,
	Rarity as BridgeRarity,
	Release as BridgeRelease,
	Treatment as BridgeTreatment,
} from "@flesh-and-blood/types";
import type { RawCard, RawPrinting } from "./raw-card-data";

/**
 * Sets whose full card list has not reached the-fab-cube's card.json yet — a
 * new set is spoiled and pre-release-priced well before the-fab-cube carries
 * it. Usurp the Shadow Throne is the first case of this: as of writing,
 * card.json has 11 Marvel preview printings for it and set.json names it
 * "??? Set 20 ???" with no release date at all.
 *
 * fabrary maintains a spoiler-card spreadsheet that already has the whole
 * set — 263 cards, 516 printings, matching the product page's own "263 cards
 * in set", 515 of them with a TCGplayer id. It's compiled into the
 * `@flesh-and-blood/cards` npm package (pinned exactly in package.json —
 * pre-release data changes daily upstream, so bumping it is a deliberate
 * `bun update @flesh-and-blood/cards`, never a surprise). This bridge reads
 * that package for exactly the sets listed below and maps its schema onto
 * the same RawCard/RawPrinting shapes card.json already produces, so nothing
 * downstream of `buildSetPrintings` has to know the difference.
 *
 * It is deliberately self-retiring rather than a permanent second source:
 * bridgePrintings() below is only used while card.json's own printing count
 * for that code is still smaller than the bridge's. The moment the-fab-cube
 * adds the set for real, the build logs that the entry is no longer needed
 * and quietly stops using it — see the loop over this table in
 * build-pack-data.ts's main(). Removing the entry (and, eventually, the
 * dependency) at that point is housekeeping, not urgent.
 */
export const PRE_RELEASE_SETS: Record<
	string,
	{ release: BridgeRelease; name: string; releaseDate: string }
> = {
	IAR: {
		release: BridgeRelease.UsurpTheShadowThrone,
		// Must equal the tcgcsv group's own name — see resolveGroup in
		// tcgcsv.ts.
		name: "Usurp the Shadow Throne",
		// LSS's Card Vault API agrees:
		// api.cardvault.fabtcg.com/carddb/api/v1/product-cards/usurp-the-shadow-throne/
		// gives "release_date":"2026-09-25". Without this override the set
		// sorts by an empty release date, which — see the indexEntries sort
		// in build-pack-data.ts — puts it FIRST among booster sets, ahead of
		// Welcome to Rathe.
		releaseDate: "2026-09-25T00:00:00.000Z",
	},
};

/** the-fab-cube's rarity.json codes, reversed from the bridged package's own
 * Rarity enum values (its strings match the-fab-cube's rarity names
 * exactly, e.g. "Super Rare", "Marvel"). */
const BRIDGE_RARITY_TO_CODE: Record<string, string> = {
	[BridgeRarity.Basic]: "B",
	[BridgeRarity.Token]: "T",
	[BridgeRarity.Common]: "C",
	[BridgeRarity.Rare]: "R",
	[BridgeRarity.SuperRare]: "S",
	[BridgeRarity.Majestic]: "M",
	[BridgeRarity.Marvel]: "V",
	[BridgeRarity.Legendary]: "L",
	[BridgeRarity.Fabled]: "F",
	[BridgeRarity.Promo]: "P",
};

/** the bridged package leaves `foiling` undefined for a standard printing
 * rather than naming a "Standard" member the way the-fab-cube's code table
 * does — handled as a special case in toBridgeRawPrinting below, not here. */
const BRIDGE_FOILING_TO_CODE: Record<string, string> = {
	[BridgeFoiling.Rainbow]: "R",
	[BridgeFoiling.Cold]: "C",
	[BridgeFoiling.Gold]: "G",
};

/** the-fab-cube's art-variation.json codes, reversed from the bridged
 * package's own Treatment enum (no "Half Size" member exists there; IAR
 * carries none, verified against the full 516-printing census). */
const BRIDGE_TREATMENT_TO_CODE: Record<string, string> = {
	[BridgeTreatment.FA]: "FA",
	[BridgeTreatment.EA]: "EA",
	[BridgeTreatment.AA]: "AA",
	[BridgeTreatment.AB]: "AB",
	[BridgeTreatment.AT]: "AT",
};

/** One bridged printing, mapped onto the RawPrinting shape card.json
 * printings already carry — see PRE_RELEASE_SETS's own comment for why. */
function toBridgeRawPrinting(
	printing: BridgePrinting,
	setCode: string,
): RawPrinting {
	const rarity = BRIDGE_RARITY_TO_CODE[printing.rarity];
	if (!rarity) {
		throw new Error(
			`Unmapped bridge rarity "${printing.rarity}" on ${printing.identifier}. ` +
				"Add it to BRIDGE_RARITY_TO_CODE in scripts/pre-release-bridge.ts.",
		);
	}
	const foiling = printing.foiling
		? BRIDGE_FOILING_TO_CODE[printing.foiling]
		: "S";
	if (!foiling) {
		throw new Error(
			`Unmapped bridge foiling "${printing.foiling}" on ${printing.identifier}. ` +
				"Add it to BRIDGE_FOILING_TO_CODE in scripts/pre-release-bridge.ts.",
		);
	}
	const artVariations = (printing.treatments ?? []).map((treatment) => {
		const code = BRIDGE_TREATMENT_TO_CODE[treatment];
		if (!code) {
			throw new Error(
				`Unmapped bridge treatment "${treatment}" on ${printing.identifier}. ` +
					"Add it to BRIDGE_TREATMENT_TO_CODE in scripts/pre-release-bridge.ts.",
			);
		}
		return code;
	});
	return {
		// The printing's own collector id, e.g. "IAR206". NEVER
		// printing.image: that's "IAR206-RF" for a Rainbow printing (foil-
		// baked artwork), which would double up with this app's own foil
		// shader — see printingImageUrl's comment in fab-printings.ts.
		id: printing.identifier,
		set_id: setCode,
		rarity,
		foiling,
		// Single-run set; the bridged package leaves `edition` undefined
		// for every IAR printing.
		edition: "N",
		expansion_slot: printing.isExpansionSlot ?? false,
		tcgplayer_product_id: printing.tcgplayer?.productId ?? null,
		// The bridged schema has no unique id of its own. `print` (e.g.
		// "IAR159-Cold-Full Art") is distinct across every printing of a
		// set — verified for all 516 IAR printings — and is only ever
		// consumed as this build's own Cardmarket snapshot key, rebuilt
		// fresh every run, so a synthetic id here is safe.
		unique_id: printing.print,
		art_variations: artVariations,
		// A bare slug ("IAR206", "IAR159-MV"), not a URL — build-pack-data.ts's
		// toArtSlug tolerates that fine, since it only strips a path and
		// extension neither of which are present.
		image_url: printing.image ?? null,
		double_sided_card_info: printing.oppositeImage
			? [
					{
						other_face_unique_id: printing.oppositeImage,
						is_DFC: true,
					},
				]
			: undefined,
	};
}

/** Builds one pre-release set's RawCard/RawPrinting lists from the bridged
 * package — see PRE_RELEASE_SETS's own comment. Only a card's printings
 * for THIS set are kept; the bridged package lists every reprint of a card
 * across every set it's been in (IAR reprints ~80 cards from earlier
 * sets), and those belong to their own set's pool, not this one's. */
export function bridgePrintings(
	code: string,
	entry: (typeof PRE_RELEASE_SETS)[string],
): { cards: RawCard[]; printings: RawPrinting[] } {
	const cards: RawCard[] = [];
	const printings: RawPrinting[] = [];
	for (const card of bridgeCards) {
		const setPrintings = card.printings.filter(
			(printing) => printing.set === entry.release,
		);
		if (setPrintings.length === 0) continue;
		const rawPrintings = setPrintings.map((printing) =>
			toBridgeRawPrinting(printing, code),
		);
		cards.push({
			name: card.name,
			pitch: String(card.pitch ?? ""),
			cost: String(card.cost ?? ""),
			power: String(card.power ?? ""),
			defense: String(card.defense ?? ""),
			// Flattened onto the-fab-cube's shape, which packs a card's class,
			// talent and subtypes into the same one `types` array the rest of
			// this script already reads (see isClassCard/hasType in
			// fab-printings.ts). Generic is the bridged package's placeholder
			// for "no class", and classless cards can also carry an undefined
			// entry here, because the package's `classes` names an enum member
			// the pinned types package no longer has. Neither is a real class
			// name the-fab-cube would print, and isClassCard would crash on the
			// undefined one.
			types: [
				...card.classes.filter((c) => c && c !== BridgeClass.Generic),
				...(card.talents ?? []),
				...card.types,
				...card.subtypes,
			],
			printings: rawPrintings,
		});
		printings.push(...rawPrintings);
	}
	return { cards, printings };
}
