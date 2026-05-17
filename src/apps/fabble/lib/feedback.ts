import { SET_NAME_TO_INDEX } from "./constants";
import type {
	CanonicalCard,
	DailyCard,
	FeedbackCell,
	FeedbackRow,
	NumericStat,
	SetComparison,
} from "./types";

// ─── Column evaluators ────────────────────────────────────────────────────────

function evaluateType(guess: CanonicalCard, daily: DailyCard): FeedbackCell {
	// Set equality (order-insensitive)
	const gSet = new Set(guess.types);
	const dSet = new Set(daily.types);
	const equal = gSet.size === dSet.size && [...gSet].every((t) => dSet.has(t));
	if (equal) return { state: "match", value: daily.types.join(" / ") };
	return { state: "no-match" };
}

export function humanizeClass(c: string): string {
	return c === "NotClassed" ? "None" : c;
}

function evaluateClass(guess: CanonicalCard, daily: DailyCard): FeedbackCell {
	const gSet = new Set(guess.classes);
	const dSet = new Set(daily.classes);

	// Full match: identical sets
	if (gSet.size === dSet.size && [...gSet].every((c) => dSet.has(c))) {
		const displayValue = daily.classes.map(humanizeClass).join(" / ") || "—";
		return { state: "match", value: displayValue };
	}

	// Partial: any overlap
	// Generic-against-non-Generic produces zero overlap naturally
	const overlapping = [...gSet].filter((c) => dSet.has(c));
	if (overlapping.length > 0) {
		return {
			state: "partial",
			guessValue: guess.classes.map(humanizeClass).join(" / "),
			overlapping: overlapping.map(humanizeClass),
		};
	}

	return { state: "no-match" };
}

function evaluateTalent(guess: CanonicalCard, daily: DailyCard): FeedbackCell {
	const gArr = guess.talents;
	const dArr = daily.talents;

	// Both empty: confirmed no talent — useful deduction signal (match)
	if (gArr.length === 0 && dArr.length === 0) {
		return { state: "match", value: "—" };
	}

	// Full set equality
	const gSet = new Set(gArr);
	const dSet = new Set(dArr);
	if (gSet.size === dSet.size && [...gSet].every((t) => dSet.has(t))) {
		return { state: "match", value: daily.talents.join(" / ") };
	}

	// Partial: any overlap between non-empty arrays
	// One empty / one non-empty → no overlap → NoMatchCell (no special case needed)
	const overlapping = [...gSet].filter((t) => dSet.has(t));
	if (overlapping.length > 0) {
		return {
			state: "partial",
			guessValue: gArr.join(" / "),
			overlapping,
		};
	}

	return { state: "no-match" };
}

function evaluatePitch(guess: CanonicalCard, daily: DailyCard): FeedbackCell {
	const gPitches = guess.pitchSet;
	const dPitch = daily.pitch;

	// Both no-pitch: MatchCell with "—" — conveys positive deduction signal
	if (dPitch === undefined && gPitches.length === 0) {
		return { state: "match", value: "—" };
	}

	// Guess has pitch, daily has none
	if (dPitch === undefined && gPitches.length > 0) {
		return { state: "no-match", revealedDailyValue: "—" };
	}

	// Daily has pitch, guess has none — rainbow check
	if (dPitch !== undefined && gPitches.length === 0) {
		if (daily.isRainbow)
			return { state: "match", value: "rainbow", rainbowHint: true };
		return { state: "no-match", revealedDailyValue: dPitch };
	}

	// Both have pitch
	if (dPitch !== undefined) {
		if (gPitches.includes(dPitch)) {
			// Match — attach rainbow hint so tile shows "All colors" if daily is rainbow
			return daily.isRainbow
				? { state: "match", value: dPitch, rainbowHint: true }
				: { state: "match", value: dPitch };
		}
		// Mismatch — if daily is rainbow the answer still covers all pitches
		if (daily.isRainbow)
			return { state: "match", value: "rainbow", rainbowHint: true };
		return { state: "no-match", revealedDailyValue: dPitch };
	}

	return { state: "no-match" };
}

function evaluateNumericStat(
	gStat: NumericStat,
	dStat: NumericStat,
): FeedbackCell {
	// Daily is na: only a true N/A match when the guess is also na.
	// If the guess has a real value, the player needs a card without this stat → no-match
	// with the ban-icon hint so they know to look for a card that lacks this attribute.
	if (dStat.kind === "na") {
		if (gStat.kind === "na") return { state: "na" };
		return { state: "no-match", naDaily: true };
	}

	// Guess is na but daily has a real value: treat absence as below any value
	if (gStat.kind === "na") return { state: "no-match", direction: "higher" };

	// Both special: match on string equality; no direction
	if (gStat.kind === "special" && dStat.kind === "special") {
		if (gStat.value === dStat.value)
			return { state: "match", value: dStat.value };
		return { state: "no-match" };
	}

	// Mixed numeric/special: no-match without direction
	if (gStat.kind !== dStat.kind) return { state: "no-match" };

	// Both numeric — TypeScript narrows after the checks above
	if (gStat.kind !== "numeric" || dStat.kind !== "numeric")
		return { state: "no-match" };
	const gVal = gStat.value;
	const dVal = dStat.value;
	if (gVal === dVal) return { state: "match", value: dVal };
	return {
		state: "no-match",
		direction: dVal > gVal ? "higher" : "lower",
		revealedDailyValue: dVal,
	};
}

function evaluateLifeOrIntellect(
	guess: CanonicalCard,
	daily: DailyCard,
): FeedbackCell {
	const g = guess.lifeOrIntellect;
	const d = daily.lifeOrIntellect;

	// Both absent: confirmed neither card has this stat
	if (g === undefined && d === undefined) return { state: "na" };

	// Daily has a value, guess doesn't: the answer's life/int is higher than "none"
	if (g === undefined && d !== undefined) {
		return { state: "no-match", direction: "higher", revealedDailyValue: d.value };
	}

	// Guess has a value, daily doesn't: no useful direction
	if (g !== undefined && d === undefined) {
		return { state: "no-match" };
	}

	// Both present but different labels (ally life vs hero intellect): not comparable
	if (g!.label !== d!.label) return { state: "na" };

	// Same label: compare numerically
	if (g!.value === d!.value) return { state: "match", value: d!.value };
	return {
		state: "no-match",
		direction: d!.value > g!.value ? "higher" : "lower",
		revealedDailyValue: d!.value,
	};
}

function evaluateTagSet(gTags: string[], dTags: string[]): FeedbackCell {
	const gSet = new Set(gTags);
	const dSet = new Set(dTags);

	if (gSet.size === 0 && dSet.size === 0) return { state: "match", value: "—" };

	if (gSet.size === dSet.size && [...gSet].every((t) => dSet.has(t))) {
		return { state: "match", value: [...dSet].join(", ") };
	}

	const overlapping = [...gSet].filter((t) => dSet.has(t));
	if (overlapping.length > 0) {
		return { state: "partial", guessValue: [...gSet].join(", "), overlapping };
	}

	return { state: "no-match" };
}

function evaluateSubtype(guess: CanonicalCard, daily: DailyCard): FeedbackCell {
	return evaluateTagSet(guess.subtypes, daily.subtypes);
}

function evaluateKeyword(guess: CanonicalCard, daily: DailyCard): FeedbackCell {
	return evaluateTagSet(guess.keywords, daily.keywords);
}

function buildSetComparisons(
	guess: CanonicalCard,
	daily: DailyCard,
): SetComparison[] {
	const dSets = new Set(daily.sets);
	const comparisons = guess.sets.map((setName) => {
		if (dSets.has(setName)) return { name: setName, state: "match" as const };
		const guessSetIdx = SET_NAME_TO_INDEX[setName] ?? Number.POSITIVE_INFINITY;
		return {
			name: setName,
			state: (daily.earliestSetIndex > guessSetIdx ? "higher" : "lower") as
				| "higher"
				| "lower",
		};
	});
	// Show newest printing first so the player reads the most recent release context first
	comparisons.sort((a, b) => {
		const idxA = SET_NAME_TO_INDEX[a.name] ?? Number.POSITIVE_INFINITY;
		const idxB = SET_NAME_TO_INDEX[b.name] ?? Number.POSITIVE_INFINITY;
		return idxB - idxA;
	});
	return comparisons;
}

function evaluateSet(guess: CanonicalCard, daily: DailyCard): FeedbackCell {
	// Reprint-generous rule: any shared set = match
	const gSets = new Set(guess.sets);
	const dSets = new Set(daily.sets);
	const shared = [...gSets].filter((s) => dSets.has(s));
	const setComparisons = buildSetComparisons(guess, daily);

	if (shared.length > 0) {
		const displaySet = daily.sets.find((s) => gSets.has(s)) ?? shared[0];
		return { state: "match", value: displaySet, setComparisons };
	}

	return {
		state: "no-match",
		direction:
			daily.earliestSetIndex > guess.earliestSetIndex ? "higher" : "lower",
		setComparisons,
	};
}

// ─── Main evaluate function ───────────────────────────────────────────────────

/**
 * Pure function. Accepts the guessed canonical card and the daily card;
 * returns a complete FeedbackRow. No I/O, no React, no side effects.
 */
export function evaluateGuess(
	guess: CanonicalCard,
	daily: DailyCard,
): FeedbackRow {
	return {
		type: evaluateType(guess, daily),
		class: evaluateClass(guess, daily),
		talent: evaluateTalent(guess, daily),
		pitch: evaluatePitch(guess, daily),
		cost: evaluateNumericStat(guess.cost, daily.cost),
		power: evaluateNumericStat(guess.power, daily.power),
		defense: evaluateNumericStat(guess.defense, daily.defense),
		lifeOrIntellect: evaluateLifeOrIntellect(guess, daily),
		subtype: evaluateSubtype(guess, daily),
		keyword: evaluateKeyword(guess, daily),
		set: evaluateSet(guess, daily),
	};
}
