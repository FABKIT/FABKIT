import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FabbleModes, type FabbleMode, type FeedbackRow, type GuessEntry } from "@fabkit/apps/fabble/lib/types";

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
	copyError: boolean;
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

function buildShareText(payload: SharePayload, modeName: string): string {
	const { guesses, date, guessLimit, won } = payload;
	const emojiGrid = guesses.map((g) => rowToEmoji(g.feedbackRow)).join("\n");
	const scoreLine = won ? `${guesses.length}/${guessLimit}` : `X/${guessLimit}`;

	return `Fabble ${modeName} ${date}\n${emojiGrid}\n${scoreLine}\n\nfabkit.app/fabble`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShareResult(): UseShareResultResult {
	const { t } = useTranslation("fabble");
	const [copied, setCopied] = useState(false);
	const [copyError, setCopyError] = useState(false);

	function share(payload: SharePayload): void {
		const modeName = t(FabbleModes[payload.mode]);
		const text = buildShareText(payload, modeName);

		if (navigator.share) {
			navigator.share({ text }).catch((e: unknown) => {
				if (e instanceof DOMException && e.name === "AbortError") return;
				copyToClipboard(text);
			});
		} else {
			copyToClipboard(text);
		}
	}

	async function copyToClipboard(text: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setCopyError(false);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopyError(true);
			setTimeout(() => setCopyError(false), 3000);
		}
	}

	return { share, copied, copyError };
}
