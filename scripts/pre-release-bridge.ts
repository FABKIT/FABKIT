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
 * Sets whose full card list has not reached the-fab-cube's card.json yet.
 * Reads the `@flesh-and-blood/cards` package (pinned exactly; bump
 * deliberately) for the listed sets and maps it onto RawCard/RawPrinting.
 * Self-retiring: bridgePrintings() is only used while card.json has fewer
 * printings for the code; the build logs when an entry is no longer needed.
 */
export const PRE_RELEASE_SETS: Record<
	string,
	{ release: BridgeRelease; name: string; releaseDate: string }
> = {
	IAR: {
		release: BridgeRelease.UsurpTheShadowThrone,
		// Must equal the tcgcsv group's own name (see resolveGroup).
		name: "Usurp the Shadow Throne",
		// Without a release date the set would sort first among booster sets.
		releaseDate: "2026-09-25T00:00:00.000Z",
	},
};

/** the-fab-cube's rarity.json codes, reversed from the bridged Rarity enum. */
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

/** the-fab-cube's art-variation.json codes, reversed from the bridged Treatment enum. */
const BRIDGE_TREATMENT_TO_CODE: Record<string, string> = {
	[BridgeTreatment.FA]: "FA",
	[BridgeTreatment.EA]: "EA",
	[BridgeTreatment.AA]: "AA",
	[BridgeTreatment.AB]: "AB",
	[BridgeTreatment.AT]: "AT",
};

/** One bridged printing, mapped onto the RawPrinting shape. */
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
		// Collector id, never printing.image (foil-baked art doubles up with our shader).
		id: printing.identifier,
		set_id: setCode,
		rarity,
		foiling,
		// Single-run set.
		edition: "N",
		expansion_slot: printing.isExpansionSlot ?? false,
		tcgplayer_product_id: printing.tcgplayer?.productId ?? null,
		// No unique id in the bridged schema; `print` is distinct per printing.
		unique_id: printing.print,
		art_variations: artVariations,
		// A bare slug, not a URL; toArtSlug tolerates that.
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

/** Builds one pre-release set's cards and printings. Only printings for THIS
 * set are kept; reprints belong to their own set's pool. */
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
			// Flattened onto the-fab-cube's `types` shape. Generic and undefined
			// class entries are dropped (isClassCard would crash on undefined).
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
