import { getToday, msUntilLocalMidnight } from "@fabkit/apps/fabble/game/date";
import { useEffect, useState } from "react";

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

function formatDuration(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Live HH:MM:SS countdown to local midnight. The target midnight is captured once
    at mount — ticking against wall-clock time from there — so crossing it actually
    surfaces as "elapsed" instead of the next tick silently recomputing a fresh ~24h
    countdown against the day that just started. Callers show a "New puzzle
    available" action once elapsed. */
export function useCountdown(): { label: string; elapsed: boolean } {
	const [targetMs] = useState(
		() => Date.now() + msUntilLocalMidnight(getToday()),
	);
	const [msRemaining, setMsRemaining] = useState(() => targetMs - Date.now());

	useEffect(() => {
		const interval = setInterval(() => {
			setMsRemaining(targetMs - Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, [targetMs]);

	return { label: formatDuration(msRemaining), elapsed: msRemaining <= 0 };
}
