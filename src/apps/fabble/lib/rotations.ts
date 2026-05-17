import type { CanonicalCard } from "./types";

export interface Rotation {
	id: string;
	labelKey: string;
	predicate: (card: CanonicalCard) => boolean;
}

// ─── Class rotation schedule ──────────────────────────────────────────────────
// Only classes with a large enough card pool are included.
// Shapeshifter, Adjudicator, Merchant, Bard, Necromancer excluded.

const ROTATION_CLASSES = [
	"Warrior",
	"Guardian",
	"Ninja",
	"Assassin",
	"Wizard",
	"Runeblade",
	"Ranger",
	"Brute",
	"Mechanologist",
	"Illusionist",
] as const;

// Fixed epoch for deterministic week numbering
const ROTATION_EPOCH_MS = Date.UTC(2024, 0, 1); // Jan 1, 2024 = week 0

function getWeekNumber(date: string): number {
	const [year, month, day] = date.split("-").map(Number);
	const dateMs = Date.UTC(year, month - 1, day);
	return Math.floor((dateMs - ROTATION_EPOCH_MS) / (7 * 86_400_000));
}

const EQUIPMENT_ROTATION: Rotation = {
	id: "equipment",
	labelKey: "rotation.equipment",
	predicate: (c) => c.types.includes("Equipment"),
};

function buildClassRotation(className: string): Rotation {
	const key = className.toLowerCase();
	return {
		id: `class_${key}`,
		labelKey: `rotation.class_${key}`,
		predicate: (c) => c.classes.includes(className),
	};
}

/**
 * Returns the active rotation for a given YYYY-MM-DD date, or null if none.
 * Monday (UTC day 1) = Equipment.
 * Thursday (UTC day 4) = rotating class, cycling weekly through ROTATION_CLASSES.
 * Pure function — deterministic for all users on the same date.
 */
export function getRotationForDate(date: string): Rotation | null {
	const [year, month, day] = date.split("-").map(Number);
	const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

	if (dow === 1) return EQUIPMENT_ROTATION;

	if (dow === 4) {
		const weekNum = getWeekNumber(date);
		const idx =
			((weekNum % ROTATION_CLASSES.length) + ROTATION_CLASSES.length) %
			ROTATION_CLASSES.length;
		return buildClassRotation(ROTATION_CLASSES[idx]);
	}

	return null;
}
