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

export interface NumericComparison {
	state: "match" | "miss";
	direction?: "higher" | "lower";
	revealedValue?: string;
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
	const intersects = guessVals.some((v) => answerVals.includes(v));
	if (intersects) {
		return { state: "match" };
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
		return {
			state: "miss",
			direction: "higher",
			revealedValue: [...aNums].sort((a, b) => a - b).join(" / "),
		};
	}
	if (gMin > aMax) {
		return {
			state: "miss",
			direction: "lower",
			revealedValue: [...aNums].sort((a, b) => a - b).join(" / "),
		};
	}
	return { state: "miss", revealedValue: aNums.join(", ") };
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

/** Earliest non-promo printing, falling back to a promo if the card has none.
    Single source of promo display priority — used by the end panel, Hint 2, and here. */
export function earliestRegularPrinting(card: FabbleCard): FabbleSetPrinting {
	const regular = card.sets.filter((s) => !s.promo);
	const pool = regular.length > 0 ? regular : card.sets;
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
		revealedValue: comparison.revealedValue,
		notApplicable: comparison.notApplicable,
	};
}

function pitchColumn(guess: FabbleCard, answer: FabbleCard): ColumnFeedback {
	const guessRainbow =
		guess.pitches.includes(1) &&
		guess.pitches.includes(2) &&
		guess.pitches.includes(3);
	if (guessRainbow) {
		return {
			column: "pitch",
			state: "match",
			guessDisplay: formatVals(guess.pitches),
			isRainbow: true,
		};
	}
	if (guess.pitches.length === 0 && answer.pitches.length === 0) {
		return { column: "pitch", state: "match", guessDisplay: "" };
	}
	const intersects = guess.pitches.some((p) => answer.pitches.includes(p));
	return {
		column: "pitch",
		state: intersects ? "match" : "miss",
		guessDisplay: formatVals(guess.pitches),
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
