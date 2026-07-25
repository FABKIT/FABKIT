import type {
	ColumnFeedback,
	FabbleCard,
	FabbleSetPrinting,
	GuessResult,
} from "@fabkit/apps/fabble/types";

type NumericVal = number | "X" | "*";

function isNumber(v: NumericVal): v is number {
	return typeof v === "number";
}

function formatVals(vals: (string | number)[]): string {
	return vals.length === 0 ? "" : vals.join(", ");
}

function lifeAsArray(card: FabbleCard): number[] {
	return card.life === null ? [] : [card.life];
}

/** Order-insensitive set equality, used to require an EXACT match on multi-value
    columns (numbers, pitch) rather than any overlap — a mono guess against a rainbow
    answer with different stats per colour is a partial, not a match. */
function sameValueSet<T>(a: T[], b: T[]): boolean {
	const aSet = new Set(a);
	const bSet = new Set(b);
	if (aSet.size !== bSet.size) return false;
	for (const v of aSet) if (!bSet.has(v)) return false;
	return true;
}

export interface NumericComparison {
	state: "match" | "partial" | "miss";
	direction?: "higher" | "lower";
	shared?: string[];
	notApplicable?: boolean;
}

function compareNumericSet(
	guessVals: NumericVal[],
	answerVals: NumericVal[],
): NumericComparison {
	if (guessVals.length === 0 && answerVals.length === 0) {
		return { state: "match" };
	}
	if (guessVals.length === 0 && answerVals.length > 0) {
		return { state: "miss" };
	}
	if (answerVals.length === 0 && guessVals.length > 0) {
		return { state: "miss", notApplicable: true };
	}
	if (sameValueSet(guessVals, answerVals)) {
		return { state: "match" };
	}
	const shared = guessVals.filter((v) => answerVals.includes(v));
	if (shared.length > 0) {
		return {
			state: "partial",
			shared: [...new Set(shared)].map(String).sort(),
		};
	}

	const gNums = guessVals.filter(isNumber);
	const aNums = answerVals.filter(isNumber);
	if (gNums.length === 0 || aNums.length === 0) {
		return { state: "miss" };
	}
	const gMax = Math.max(...gNums);
	const gMin = Math.min(...gNums);
	const aMax = Math.max(...aNums);
	const aMin = Math.min(...aNums);
	if (gMax < aMin) {
		return { state: "miss", direction: "higher" };
	}
	if (gMin > aMax) {
		return { state: "miss", direction: "lower" };
	}
	return { state: "miss" };
}

function compareSet(
	guessVals: string[],
	answerVals: string[],
	emptyAnswerIsBan: boolean,
): {
	state: "match" | "partial" | "miss";
	shared?: string[];
	notApplicable?: boolean;
} {
	if (guessVals.length === 0 && answerVals.length === 0) {
		return { state: "match" };
	}
	const shared = guessVals.filter((v) => answerVals.includes(v));
	const isEqual =
		guessVals.length === answerVals.length &&
		shared.length === guessVals.length;
	if (isEqual) {
		return { state: "match" };
	}
	if (answerVals.length === 0 && guessVals.length > 0) {
		return emptyAnswerIsBan
			? { state: "miss", notApplicable: true }
			: { state: "miss" };
	}
	if (shared.length > 0) {
		return { state: "partial", shared: [...shared].sort() };
	}
	return { state: "miss" };
}

/** Earliest main-set printing, preferred over limited-print (Blitz Deck / Commander/CC Deck)
    and promo (Promos/GEM) printings in that order — a 3-tier fallback: main sets first, then
    non-promo limited-print sets (for cards with no main-set printing at all), then anything
    including promos as a last resort. Single source of display priority — used by the end
    panel, Hint 2, and here. Cards without `limitedPrint` data (older/dev fixtures) fall
    through the middle tier unaffected, so this collapses to the old 2-tier behavior. */
export function earliestRegularPrinting(card: FabbleCard): FabbleSetPrinting {
	const mainSets = card.sets.filter((s) => !s.promo && !s.limitedPrint);
	const nonPromo = card.sets.filter((s) => !s.promo);
	const pool =
		mainSets.length > 0 ? mainSets : nonPromo.length > 0 ? nonPromo : card.sets;
	return pool.reduce((earliest, s) =>
		s.order < earliest.order ? s : earliest,
	);
}

function compareSetColumn(
	guess: FabbleCard,
	answer: FabbleCard,
): { state: "match" | "miss"; setDetails: ColumnFeedback["setDetails"] } {
	const answerCodes = new Set(answer.sets.map((s) => s.code));
	const answerRegular = answer.sets.filter((s) => !s.promo);
	const answerRegularMin = answerRegular.length
		? Math.min(...answerRegular.map((s) => s.order))
		: null;
	const answerRegularMax = answerRegular.length
		? Math.max(...answerRegular.map((s) => s.order))
		: null;

	const matched = guess.sets.some((s) => answerCodes.has(s.code));

	const promos = guess.sets.filter((s) => s.promo);
	const nonPromos = [...guess.sets.filter((s) => !s.promo)].sort(
		(a, b) => b.order - a.order,
	);
	const ordered = [...promos, ...nonPromos];

	const setDetails = ordered.map((s) => {
		const shared = answerCodes.has(s.code);
		if (shared)
			return { code: s.code, promo: !!s.promo, mark: "check" as const };
		if (s.promo || answerRegularMin === null || answerRegularMax === null) {
			return { code: s.code, promo: !!s.promo, mark: null };
		}
		if (answerRegularMin > s.order) {
			return { code: s.code, promo: false, mark: "higher" as const };
		}
		if (answerRegularMax < s.order) {
			return { code: s.code, promo: false, mark: "lower" as const };
		}
		return { code: s.code, promo: false, mark: null };
	});

	return { state: matched ? "match" : "miss", setDetails };
}

function setColumn(
	column: ColumnFeedback["column"],
	guessVals: string[],
	answerVals: string[],
	emptyAnswerIsBan: boolean,
): ColumnFeedback {
	const comparison = compareSet(guessVals, answerVals, emptyAnswerIsBan);
	return {
		column,
		state: comparison.state,
		guessDisplay: formatVals(guessVals),
		shared: comparison.shared,
		notApplicable: comparison.notApplicable,
	};
}

function numericColumn(
	column: ColumnFeedback["column"],
	guessVals: NumericVal[],
	answerVals: NumericVal[],
): ColumnFeedback {
	const comparison = compareNumericSet(guessVals, answerVals);
	return {
		column,
		state: comparison.state,
		guessDisplay: formatVals(guessVals),
		direction: comparison.direction,
		shared: comparison.shared,
		notApplicable: comparison.notApplicable,
	};
}

function pitchColumn(guess: FabbleCard, answer: FabbleCard): ColumnFeedback {
	const guessRainbow =
		guess.pitches.includes(1) &&
		guess.pitches.includes(2) &&
		guess.pitches.includes(3);
	const guessDisplay = formatVals(guess.pitches);

	if (guess.pitches.length === 0 && answer.pitches.length === 0) {
		return { column: "pitch", state: "match", guessDisplay: "" };
	}
	if (sameValueSet(guess.pitches, answer.pitches)) {
		return {
			column: "pitch",
			state: "match",
			guessDisplay,
			isRainbow: guessRainbow || undefined,
		};
	}
	const shared = guess.pitches.filter((p) => answer.pitches.includes(p));
	return {
		column: "pitch",
		state: shared.length > 0 ? "partial" : "miss",
		guessDisplay,
		shared:
			shared.length > 0 ? [...new Set(shared)].map(String).sort() : undefined,
		isRainbow: guessRainbow || undefined,
	};
}

export function compareCards(
	guess: FabbleCard,
	answer: FabbleCard,
): GuessResult {
	const setComparison = compareSetColumn(guess, answer);

	const columns: ColumnFeedback[] = [
		{
			column: "type",
			state: guess.type === answer.type ? "match" : "miss",
			guessDisplay: guess.type,
		},
		setColumn("class", guess.classes, answer.classes, true),
		setColumn("talent", guess.talents, answer.talents, true),
		pitchColumn(guess, answer),
		numericColumn("cost", guess.costs, answer.costs),
		numericColumn("power", guess.powers, answer.powers),
		numericColumn("defense", guess.defenses, answer.defenses),
		numericColumn("life", lifeAsArray(guess), lifeAsArray(answer)),
		// subtypes and keywords: answer-empty is plain red, not ban
		setColumn("subtypes", guess.subtypes, answer.subtypes, false),
		setColumn("keywords", guess.keywords, answer.keywords, false),
		{
			column: "set",
			state: setComparison.state,
			guessDisplay: formatVals(guess.sets.map((s) => s.code)),
			setDetails: setComparison.setDetails,
		},
	];

	const correct = guess.id === answer.id;
	const isTwin = !correct && columns.every((c) => c.state === "match");

	return { guessId: guess.id, correct, isTwin, columns };
}
