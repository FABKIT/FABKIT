// ─── Mode type ────────────────────────────────────────────────────────────────

export type FabbleMode = "standard" | "chaos";

// RawCard is the Card type from @flesh-and-blood/types.
// It is defined here to allow pool.ts to reference it without importing the
// devDependency package directly. The runtime app never uses this type — it is
// only consumed by the build-time pool.ts and build-pool.ts scripts.
// The minimal interface below matches the fields pool.ts actually uses.
// biome-ignore lint/suspicious/noExplicitAny: intentional — raw card data from devDep at build time
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
	pitchVariants: Array<{
		pitch: number | undefined;
		cardIdentifier: string;
		defaultImage: string; // CDN image key, e.g. "MST131"
	}>;
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
	dailyName?: string; // deprecated, no longer written by new sessions
	guesses: GuessEntry[];
	status: "in_progress" | "won" | "lost";
	startedAt: string; // ISO 8601
	revealedHintCount?: number; // optional — absent in sessions written before hints shipped
	reveal?: DailyCard;
	workerHints?: { rarity: string; firstSet: string | null };
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
	| { ok: false; error: "unknown_card" | "already_guessed" | "game_over" | "network_error" };

// ─── Session state (in-memory, used by store) ────────────────────────────────

export interface SessionState {
	mode: FabbleMode;
	date: string;
	poolVersion: string;
	daily: DailyCard | null; // null during gameplay, set on Worker reveal
	guesses: GuessEntry[];
	status: "in_progress" | "won" | "lost";
	startedAt: string;
	revealedHintCount: number;
	workerHints: { rarity: string; firstSet: string | null } | null;
}
