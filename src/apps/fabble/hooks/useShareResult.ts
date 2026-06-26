import {
	type FabbleMode,
	FabbleModes,
	type FeedbackRow,
	type GuessEntry,
} from "@fabkit/apps/fabble/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
	share: (payload: SharePayload) => Promise<void>;
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

	// Track mounted state and pending timers to prevent state updates after unmount
	const mountedRef = useRef(true);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			for (const timer of timersRef.current) clearTimeout(timer);
		};
	}, []);

	const copyToClipboard = useCallback(async (text: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(text);
			if (!mountedRef.current) return;
			setCopied(true);
			setCopyError(false);
			const timer = setTimeout(() => {
				if (mountedRef.current) setCopied(false);
			}, 2000);
			timersRef.current.push(timer);
		} catch {
			if (!mountedRef.current) return;
			setCopyError(true);
			const timer = setTimeout(() => {
				if (mountedRef.current) setCopyError(false);
			}, 3000);
			timersRef.current.push(timer);
		}
	}, []);

	const share = useCallback(
		async (payload: SharePayload): Promise<void> => {
			const modeName = t(FabbleModes[payload.mode]);
			const text = buildShareText(payload, modeName);

			if (navigator.share) {
				try {
					await navigator.share({ text });
				} catch (e: unknown) {
					if (e instanceof DOMException && e.name === "AbortError") return;
					await copyToClipboard(text);
				}
			} else {
				await copyToClipboard(text);
			}
		},
		[t, copyToClipboard],
	);

	return { share, copied, copyError };
}
