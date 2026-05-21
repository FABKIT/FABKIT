// ─── Mode type ────────────────────────────────────────────────────────────────

export const FabbleModes = {
	standard: "mode.standard",
	chaos: "mode.chaos",
} as const;

export type FabbleMode = keyof typeof FabbleModes;

// RawCard is the Card type from @flesh-and-blood/types.
// Defined here so pool.ts (build-time only) can import it without the devDep.
// Runtime code never references RawCard. The `any` is intentional — importing
// @flesh-and-blood/cards at runtime would bloat the bundle.
// biome-ignore lint/suspicious/noExplicitAny: intentional — build-time only, see comment
export type RawCard = any;

// ─── Numeric stat discriminated union ────────────────────────────────────────

export type NumericStat =
	| { kind: "numeric"; value: number }
	| { kind: "special"; value: string } // e.g. "X", "XX", "*"
	| { kind: "na" }; // field absent on this card type

// ─── Canonical card (guessable unit — one per logical card name) ──────────────

export interface CanonicalCard {
	name: string; // "Snatch" — the guess key
	types: string[]; // e.g. ["Action"]
	classes: string[]; // e.g. ["Warrior"] or ["Warrior","Wizard"]
	talents: string[]; // e.g. ["Draconic"] — empty array if none
	pitchSet: number[]; // [1,2,3] for rainbow; [2] for single-pitch; [] for no-pitch
	cost: NumericStat;
	power: NumericStat;
	defense: NumericStat;
	lifeOrIntellect: { value: number; label: "life" | "intellect" } | undefined;
	subtypes: string[];
	keywords: string[];
	sets: string[]; // all sets this card appears in, sorted by earliestSetIndex
	earliestSetIndex: number; // index into SET_ORDER for directional comparison
	isRainbow: boolean; // true if pitchSet.length > 1
	isBanned: boolean; // true if banned in Classic Constructed
	isAmbiguous: boolean; // fingerprint-identical to another card — never a daily answer, but still guessable
	rarities: string[];
	artists: string[];
	weight: number; // from PopularityProvider; default 1.0
	pitchVariants: {
		pitch: number | undefined;
		cardIdentifier: string;
		defaultImage: string; // CDN image key, e.g. "MST131"
	}[];
}

// ─── Daily card (scalar card for a given day's puzzle) ───────────────────────

export interface DailyCard {
	cardIdentifier: string; // e.g. "snatch-red"
	name: string; // "Snatch" — resolves back to CanonicalCard
	types: string[];
	classes: string[];
	talents: string[];
	pitch: number | undefined; // scalar — 1, 2, 3, or undefined (no pitch)
	cost: NumericStat;
	power: NumericStat;
	defense: NumericStat;
	lifeOrIntellect: { value: number; label: "life" | "intellect" } | undefined;
	subtypes: string[];
	keywords: string[];
	sets: string[];
	earliestSetIndex: number;
	isRainbow: boolean;
	rarities: string[];
	artists: string[];
	pitchVariantImage: string; // defaultImage of the resolved pitch variant
}

// ─── Feedback cell types ──────────────────────────────────────────────────────

export type TileState = "match" | "partial" | "no-match" | "na";
export type Direction = "higher" | "lower";

export type SetComparison = {
	name: string;
	state: "match" | "higher" | "lower";
};

export interface MatchCell {
	state: "match";
	value: string | number;
	rainbowHint?: true; // pitch tile: daily is rainbow-suite
	setComparisons?: SetComparison[]; // set column: all sets the guessed card appears in
}

export interface PartialCell {
	state: "partial";
	guessValue: string;
	overlapping?: string[];
}

export interface NoMatchCell {
	state: "no-match";
	direction?: Direction;
	revealedDailyValue?: string | number;
	setComparisons?: SetComparison[]; // set column: all sets the guessed card appears in
	naDaily?: true; // daily card has no such stat — render ban icon instead of arrow
}

export interface NaCell {
	state: "na";
}

export type FeedbackCell = MatchCell | PartialCell | NoMatchCell | NaCell;

// ─── Feedback row (one per submitted guess) ───────────────────────────────────

export interface FeedbackRow {
	type: FeedbackCell;
	class: FeedbackCell;
	talent: FeedbackCell;
	pitch: FeedbackCell;
	cost: FeedbackCell;
	power: FeedbackCell;
	defense: FeedbackCell;
	lifeOrIntellect: FeedbackCell;
	subtype: FeedbackCell;
	keyword: FeedbackCell;
	set: FeedbackCell;
}

// ─── Column IDs ───────────────────────────────────────────────────────────────

export type ColumnId =
	| "type"
	| "class"
	| "talent"
	| "pitch"
	| "cost"
	| "power"
	| "defense"
	| "lifeOrIntellect"
	| "subtype"
	| "keyword"
	| "set";

// ─── Guess entry ──────────────────────────────────────────────────────────────

export interface GuessEntry {
	name: string;
	feedbackRow: FeedbackRow;
}

// ─── Session data (stored in localStorage) ───────────────────────────────────

export interface SessionData {
	poolVersion: string;
	daily?: DailyCard; // stored so pool updates mid-day don't disrupt active sessions
	guesses: GuessEntry[];
	status: "in_progress" | "won" | "lost";
	startedAt: string; // ISO 8601
	revealedHintCount?: number; // optional — absent in sessions written before hints shipped
}

// ─── Streak data ──────────────────────────────────────────────────────────────

export interface StreakData {
	current: number;
	max: number;
	lastSolvedDate: string; // YYYY-MM-DD (UTC)
}

// ─── First visit data ─────────────────────────────────────────────────────────

export interface FirstVisitData {
	seen: true;
	date: string; // ISO 8601
}

// ─── Submit result ────────────────────────────────────────────────────────────

export type SubmitResult =
	| { ok: true }
	| { ok: false; error: "unknown_card" | "already_guessed" | "game_over" };

// ─── Session state (in-memory, used by store) ────────────────────────────────

export interface SessionState {
	mode: FabbleMode;
	date: string;
	poolVersion: string;
	daily: DailyCard; // always set immediately on initMode — never null
	guesses: GuessEntry[];
	status: "in_progress" | "won" | "lost";
	startedAt: string;
	revealedHintCount: number;
}
