import { useState } from "react";
import type {
	FabbleMode,
	FeedbackRow,
	GuessEntry,
} from "../lib/types";

// ─── Share payload ────────────────────────────────────────────────────────────

export interface SharePayload {
	guesses: GuessEntry[];
	mode: FabbleMode;
	date: string;
	guessLimit: number;
	won: boolean;
}

// ─── Hook output shape ────────────────────────────────────────────────────────

export interface UseShareResultResult {
	share: (payload: SharePayload) => void;
	copied: boolean;
}

// ─── Emoji mapping ────────────────────────────────────────────────────────────

function rowToEmoji(row: FeedbackRow): string {
	const cells = [
		row.type,
		row.class,
		row.talent,
		row.pitch,
		row.cost,
		row.power,
		row.defense,
		row.lifeOrIntellect,
		row.subtype,
		row.keyword,
		row.set,
	];
	return cells
		.map((cell): string => {
			switch (cell.state) {
				case "match":
					return "🟩";
				case "partial":
					return "🟨";
				case "no-match":
					return "🟥";
				case "na":
					return "⬜";
				default:
					return "⬜";
			}
		})
		.join("");
}

// ─── Build share text ─────────────────────────────────────────────────────────

function buildShareText(payload: SharePayload): string {
	const { guesses, mode, date, guessLimit, won } = payload;
	const modeName = mode === "standard" ? "Standard" : "Chaos";
	const emojiGrid = guesses.map((g) => rowToEmoji(g.feedbackRow)).join("\n");
	const scoreLine = won ? `${guesses.length}/${guessLimit}` : `X/${guessLimit}`;

	return `Fabble ${modeName} ${date}\n${emojiGrid}\n${scoreLine}\n\nfabkit.app/fabble`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShareResult(): UseShareResultResult {
	const [copied, setCopied] = useState(false);

	function share(payload: SharePayload): void {
		const text = buildShareText(payload);

		if (navigator.share) {
			navigator.share({ text }).catch((e: unknown) => {
				// User cancelled the share dialog — don't silently copy to clipboard
				if (e instanceof DOMException && e.name === "AbortError") return;
				copyToClipboard(text);
			});
		} else {
			copyToClipboard(text);
		}
	}

	function copyToClipboard(text: string): void {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => {
				// Clipboard API not available — silently fail
			});
	}

	return { share, copied };
}

