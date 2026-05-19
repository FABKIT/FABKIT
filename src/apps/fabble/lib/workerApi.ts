import type { DailyCard, FabbleMode, FeedbackRow } from "@fabkit/apps/fabble/lib/types";

const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string | undefined) ?? "";

if (!WORKER_URL) {
	console.error(
		"[Fabble] VITE_WORKER_URL is not set. Fabble will not work. " +
		"Add VITE_WORKER_URL=http://localhost:8787 to your .env file.",
	);
}

export interface GuessResponse {
	feedbackRow: FeedbackRow;
	correct: boolean;
	hints: { rarity: string; firstSet: string | null };
	reveal: DailyCard | null;
}

export type GuessError = "unknown_card" | "network_error";

export async function submitGuessToWorker(
	mode: FabbleMode,
	guess: string,
	lastGuess: boolean,
): Promise<{ ok: true; data: GuessResponse } | { ok: false; error: GuessError }> {
	try {
		const res = await fetch(`${WORKER_URL}/fabble/guess`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ mode, guess, lastGuess }),
		});

		if (res.status === 404) {
			const body = await res.json().catch(() => ({}));
			if ((body as { error?: string }).error === "unknown_card") {
				return { ok: false, error: "unknown_card" };
			}
		}

		if (!res.ok) {
			return { ok: false, error: "network_error" };
		}

		const data = (await res.json()) as GuessResponse;
		return { ok: true, data };
	} catch {
		return { ok: false, error: "network_error" };
	}
}
