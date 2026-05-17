import { humanizeClass } from "./feedback";
import type { CanonicalCard, ColumnId, NumericStat } from "./types";

export const PITCH_COLOR: Record<number, string> = {
	1: "red",
	2: "yellow",
	3: "blue",
};

function formatNumericStat(stat: NumericStat): string {
	if (stat.kind === "numeric") return stat.value.toString();
	if (stat.kind === "special") return stat.value;
	return "—";
}

export function formatPitchSet(pitchSet: number[]): string {
	if (pitchSet.length === 0) return "—";
	if (pitchSet.length >= 3) return "1/2/3 (rainbow)";
	return pitchSet.map((p) => `${p} (${PITCH_COLOR[p] ?? p})`).join("/");
}

export function formatPitchValue(val: string | number): string {
	if (val === "rainbow" || val === "All colors") return "all colors";
	const n = typeof val === "number" ? val : Number(val);
	if (!Number.isNaN(n) && PITCH_COLOR[n]) return `${n} (${PITCH_COLOR[n]})`;
	return String(val);
}

export function getCardColumnValues(
	card: CanonicalCard,
): Record<ColumnId, string> {
	return {
		type: card.types.join(" / ") || "—",
		class: card.classes.map(humanizeClass).join(" / ") || "—",
		talent: card.talents.length > 0 ? card.talents.join(" / ") : "None",
		pitch: formatPitchSet(card.pitchSet),
		cost: formatNumericStat(card.cost),
		power: formatNumericStat(card.power),
		defense: formatNumericStat(card.defense),
		lifeOrIntellect: card.lifeOrIntellect?.value?.toString() ?? "—",
		subtype: card.subtypes.join(", ") || "—",
		keyword: card.keywords.join(", ") || "—",
		set: card.sets[0] ?? "—",
	};
}
