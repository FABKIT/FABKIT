import { useEffect, useState } from "react";

// ─── Hook output shape ────────────────────────────────────────────────────────

export interface UseCountdownResult {
	timeString: string; // "HH:MM:SS"
	isExpired: boolean; // true when today changes
}

// ─── Helper: seconds until next UTC midnight ──────────────────────────────────

function secondsUntilMidnight(): number {
	const now = new Date();
	const midnight = new Date(
		Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate() + 1,
			0,
			0,
			0,
			0,
		),
	);
	return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCountdown(): UseCountdownResult {
	const [remaining, setRemaining] = useState(() => secondsUntilMidnight());
	const [isExpired, setIsExpired] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			const secs = secondsUntilMidnight();
			setRemaining(secs);
			if (secs === 0) {
				setIsExpired(true);
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return {
		timeString: formatTime(remaining),
		isExpired,
	};
}

