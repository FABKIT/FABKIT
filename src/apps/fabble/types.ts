import type { FabbleMode } from "@fabkit/apps/fabble/config";
import type { CardRarities } from "@fabkit/shared/config/cards/rarities";
import type { CardType } from "@fabkit/shared/config/cards/types";

/** The 9 eligible types (spec §2), as shared-vocab keys. NOTE: the shared vocab has no
    "attack_action" (card-creator models Attack as an action subtype) — Fabble's dataset
    distinguishes it as its own type, so it's added to the union. */
export type FabbleCardType =
	| Extract<
			CardType,
			| "hero"
			| "weapon"
			| "equipment"
			| "action"
			| "attack_reaction"
			| "defense_reaction"
			| "instant"
			| "ally"
	  >
	| "attack_action";

/** Shared rarity keys — reuses CardRarities icons directly. */
export type FabbleRarity = Exclude<
	keyof typeof CardRarities,
	"token" | "marvel"
>;

export interface FabbleSetPrinting {
	code: string;
	name: string;
	/** Global release ordinal across ALL FAB sets: oldest = 0, strictly increasing by release
	    date, identical for the same set on all cards. Drives Set-column arrows + Hint 2. */
	order: number;
	/** Promo printing (e.g. Promos, GEM) — an ongoing product line whose chronological rank
	    would mislead. Promos are valid printings for matching, but regular set printings
	    always take display priority: the end panel and Hint 2 use the earliest NON-promo,
	    NON-limitedPrint printing (see `limitedPrint`), and in the Set tile promos are pinned
	    to the top with a check mark when shared, otherwise no icon/arrow (never directional,
	    since a promo's release date isn't meaningful). */
	promo?: boolean;
	/** Limited-print set (e.g. a Blitz Deck or Commander/CC Deck reprint) — unlike `promo`,
	    this DOES have a real, meaningful release date, so it still gets normal chronological
	    Set-tile arrows. It's only deprioritised for *display* purposes: the end panel and
	    Hint 2 prefer a main-set printing over a limited-print one when both exist, falling
	    back to the limited-print printing only if the card has no main-set printing at all.
	    See `earliestRegularPrinting` in game/compare.ts for the exact fallback order. */
	limitedPrint?: boolean;
}

/**
 * ONE ENTRY PER CARD NAME (spec §4.4 — the player guesses "Snatch", never "Snatch (red)").
 * Pitch variants of a name are merged: array fields hold the union of distinct values
 * across variants (length 0 or 1 for most cards).
 */
export interface FabbleCard {
	/** Stable unique slug per name, lowercase kebab, e.g. "command-and-conquer".
	    NEVER changes between dataset versions — sessions persist it. */
	id: string;
	name: string;
	type: FabbleCardType;
	classes: string[];
	talents: string[];
	pitches: (1 | 2 | 3)[];
	costs: (number | "X")[];
	powers: (number | "*")[];
	defenses: (number | "*")[];
	life: number | null;
	subtypes: string[];
	keywords: string[];
	sets: FabbleSetPrinting[];
	rarity: FabbleRarity;
	artist: string;
	imageUrl: string;
	thumbnailUrl: string;
}

/** One scheduled daily puzzle. Produced ENTIRELY by the external repo. */
export interface FabbleScheduleEntry {
	/** "YYYY-MM-DD" — matched against the player's LOCAL calendar date (spec §3:
	    the puzzle follows each player's own midnight). */
	date: string;
	cardId: string;
	/** Standard only: theme-day banner info (spec §3). Absent on plain days and in chaos. */
	theme?: { kind: "equipment" } | { kind: "class"; className: string };
}

export interface FabbleDataset {
	schemaVersion: 1;
	datasetVersion: string;
	generatedAt: string;
	/** Precomputed daily schedules, one entry per calendar date, per mode.
	    External repo guarantees: a rolling window from yesterday (covers every
	    timezone's local "today") through ~14 days ahead of generatedAt;
	    anti-repeat within each pool; twins never scheduled in standard;
	    no banned/ineligible cards in standard; theme days on Mondays/Thursdays. */
	schedule: { standard: FabbleScheduleEntry[]; chaos: FabbleScheduleEntry[] };
	/** Every eligible card (the guessable universe for BOTH modes), incl. banned cards. */
	cards: FabbleCard[];
}

export const COLUMNS = [
	"type",
	"class",
	"talent",
	"pitch",
	"cost",
	"power",
	"defense",
	"life",
	"subtypes",
	"keywords",
	"set",
] as const;
export type ColumnId = (typeof COLUMNS)[number];
export type TileState = "match" | "partial" | "miss";

export interface ColumnFeedback {
	column: ColumnId;
	state: TileState;
	guessDisplay: string;
	direction?: "higher" | "lower";
	notApplicable?: boolean;
	shared?: string[];
	setDetails?: {
		code: string;
		promo: boolean;
		mark: "check" | "higher" | "lower" | null;
	}[];
	isRainbow?: boolean;
}

export interface GuessResult {
	guessId: string;
	correct: boolean;
	isTwin: boolean;
	columns: ColumnFeedback[];
}

export interface PersistedSession {
	schema: 1;
	mode: FabbleMode;
	date: string;
	answerId: string;
	datasetVersion: string;
	theme: { kind: "equipment" } | { kind: "class"; className: string } | null;
	guesses: string[];
	twinGuessIds: string[];
	/** All guess ids (spent + twin), oldest first — the real submission order,
	    since guesses and twinGuessIds don't interleave on their own. */
	order: string[];
	hintsRevealed: [boolean, boolean];
	status: "playing" | "won" | "lost";
}

export interface PersistedStreaks {
	schema: 1;
	current: number;
	best: number;
	lastResultDate: string | null;
	lastResult: "won" | "lost" | null;
}

/** Endless's current in-progress puzzle. Deliberately NOT `PersistedSession` — that shape is
    date-keyed (one puzzle per calendar day) and Endless has neither a date nor a guess cap.
    Still honors the twin free-retry rule (an all-green wrong guess doesn't spend a guess),
    same split as `PersistedSession.guesses`/`twinGuessIds`/`order`. */
export interface PersistedEndlessSession {
	schema: 1;
	answerId: string;
	datasetVersion: string;
	guesses: string[];
	twinGuessIds: string[];
	order: string[];
	status: "playing" | "won" | "gave_up";
}

/** One SOLVED puzzle in the current endless streak (win only — a give-up ends the streak,
    it isn't logged here), oldest first. `answerId` doubles as the no-repeat exclusion list
    for picking the next puzzle. */
export interface EndlessLogEntry {
	answerId: string;
	guessCount: number;
}

/** Endless's streak. Deliberately NOT `PersistedStreaks` — that shape is date-keyed
    (yesterday/today) and models "played every day", not "consecutive within a session".
    `completedLog` is scoped to the CURRENT streak — it resets to `[]` alongside `current`
    whenever a puzzle is given up on. */
export interface PersistedEndlessStreak {
	schema: 1;
	current: number;
	best: number;
	completedLog: EndlessLogEntry[];
}
