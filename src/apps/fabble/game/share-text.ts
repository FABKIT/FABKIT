import type { TileState } from "../types";

const TILE_EMOJI: Record<TileState, string> = {
	match: "🟩",
	partial: "🟨",
	miss: "🟥",
};

export function buildShareText(args: {
	username?: string;
	modeLabel: string;
	dateLabel: string;
	won: boolean;
	guessCount: number;
	maxGuesses: number;
	hintsUsed: number;
	rows: TileState[][];
	link: string;
}): string {
	const score = args.won
		? `${args.guessCount}/${args.maxGuesses}`
		: `X/${args.maxGuesses}`;
	const header = args.username
		? `${args.username} — Fabble ${args.modeLabel} · ${args.dateLabel} · ${score}`
		: `Fabble ${args.modeLabel} · ${args.dateLabel} · ${score}`;
	const lines = [header];

	if (args.hintsUsed > 0) {
		lines.push(`Hints: ${args.hintsUsed}/2`);
	}

	for (const row of args.rows) {
		lines.push(row.map((state) => TILE_EMOJI[state]).join(""));
	}

	lines.push(args.link);

	return lines.join("\n");
}
