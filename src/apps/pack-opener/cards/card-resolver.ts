import type { DrawnCard } from "@fabkit/apps/pack-opener/pack/types";
import type { CardRarity } from "@fabkit/shared/config/cards/rarities";
import type {
	FabPrinting,
	FoilTreatment,
} from "@fabkit/shared/data/fab-printings";
import {
	getSetPrintings,
	hasType,
	isClassCard,
	printingBackImageUrl,
	printingImageUrl,
} from "@fabkit/shared/data/fab-printings";
import { hashToIndex } from "@fabkit/shared/random";

/** Shape every 3D/UI component consumes. A null `imageUrl` shows the card back. */
export interface ResolvedCard {
	id: string;
	/** Null when no real card could be resolved; the UI supplies its own name. */
	name: string | null;
	rarity: CardRarity;
	treatment: FoilTreatment;
	imageUrl: string | null;
	/** The other face's art for a double-faced card, otherwise null. */
	backImageUrl: string | null;
	/** The-fab-cube's TCGplayer product id for this printing, if any. */
	tcgplayerProductId: string | null;
	/** The-fab-cube's id for this printing, which keys the euro price snapshot. Null for
	 * a placeholder, or a treatment this printing doesn't have. */
	printingId: string | null;
}

function placeholderCard(drawn: DrawnCard): ResolvedCard {
	return {
		id: drawn.id,
		name: null,
		rarity: drawn.rarity,
		treatment: drawn.treatment,
		imageUrl: null,
		backImageUrl: null,
		tcgplayerProductId: null,
		printingId: null,
	};
}

/** Rarities a Cold Foil redraw must not land on, so an upgrade can't raise their rates. */
const COLD_REDRAW_EXCLUDED: ReadonlySet<CardRarity> = new Set<CardRarity>([
	"legendary",
	"fabled",
	"marvel",
]);

/** Printings in `setCode` matching what was drawn. Foiling is a preference: filter
 * to the drawn treatment, and only fall back to the unfiltered pool when the set
 * never printed that rarity that way. A Cold Foil upgrade instead redraws from
 * the set's real cold printings, since its slot's rarity may have none (Heavy
 * Hitters upgrades a Token but prints no cold Tokens). */
export function selectPrintingPool(
	printings: FabPrinting[],
	drawn: DrawnCard,
): FabPrinting[] {
	const matching = printings.filter(
		(printing) =>
			printing.rarity === drawn.rarity &&
			printing.expansionSlot === drawn.expansionSlot &&
			(!drawn.requiresType || hasType(printing, drawn.requiresType)) &&
			(drawn.classRestricted === undefined ||
				isClassCard(printing) === drawn.classRestricted),
	);
	const sameTreatment = matching.filter(
		(printing) => printing.foiling === drawn.treatment,
	);
	if (sameTreatment.length > 0) return sameTreatment;

	if (drawn.treatment === "cold" && !COLD_REDRAW_EXCLUDED.has(drawn.rarity)) {
		const coldRedraw = printings.filter(
			(printing) =>
				printing.foiling === "cold" &&
				!COLD_REDRAW_EXCLUDED.has(printing.rarity),
		);
		if (coldRedraw.length > 0) return coldRedraw;
	}
	return matching;
}

/** Settles treatment where the odds engine and the real printing disagree. The
 * printing wins for a Fabled (always its own foiling), a "standard" draw of a
 * printing never printed plain, and a Cold Foil upgrade on a printing with no
 * cold version. Otherwise the draw stands. */
export function resolveTreatment(
	drawn: DrawnCard,
	printing: FabPrinting,
): FoilTreatment {
	if (drawn.rarity === "fabled") return printing.foiling;
	if (drawn.treatment === "standard" || drawn.treatment === "cold") {
		if (printing.foiling !== drawn.treatment) return printing.foiling;
	}
	return drawn.treatment;
}

function toResolvedCardFromPrinting(
	drawn: DrawnCard,
	printing: FabPrinting,
): ResolvedCard {
	const treatment = resolveTreatment(drawn, printing);
	return {
		id: drawn.id,
		name: printing.name,
		// The printing's rarity: a Cold Foil redraw can land on a different one.
		rarity: printing.rarity,
		treatment,
		imageUrl: printingImageUrl(printing),
		backImageUrl: printingBackImageUrl(printing),
		tcgplayerProductId: printing.tcgplayerProductId,
		printingId: treatment === printing.foiling ? printing.uniqueId : null,
	};
}

/** Picks a printing from the pack's own set, deterministically per drawn card id so
 * re-renders don't reshuffle it. Falls back to a placeholder when `setCode` is
 * missing or the set has no matching printing (data loading or failed). */
export function resolveCard(
	drawn: DrawnCard,
	setCode?: string | null,
): ResolvedCard {
	if (setCode) {
		const pool = selectPrintingPool(getSetPrintings(setCode), drawn);
		if (pool.length > 0) {
			return toResolvedCardFromPrinting(
				drawn,
				pool[hashToIndex(drawn.id, pool.length)],
			);
		}
	}
	return placeholderCard(drawn);
}
