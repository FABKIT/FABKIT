// Dev/build utility only — not imported by any component or store.
// Used by scripts/build-pool.ts to detect ambiguous cards during pool generation.
import type { CanonicalCard, NumericStat } from "./types";

// ─── Fingerprint helpers ──────────────────────────────────────────────────────

export function statKey(stat: NumericStat): string {
	if (stat.kind === "numeric") return `num:${stat.value}`;
	if (stat.kind === "special") return `spec:${stat.value}`;
	return "na";
}

/**
 * Produces a canonical fingerprint string for ambiguity detection.
 * Two cards with identical fingerprints are indistinguishable by the 10-column
 * feedback grid. Uses pitchSet (not scalar pitch) because the player wins by
 * canonical name, not a specific pitch variant.
 */
export function computeFingerprint(card: CanonicalCard): string {
	const sortedJoin = (arr: (string | number)[]) =>
		[...arr].map(String).sort().join("|");

	return [
		sortedJoin(card.types),
		sortedJoin(card.classes),
		sortedJoin(card.talents),
		sortedJoin(card.pitchSet),
		statKey(card.cost),
		statKey(card.power),
		statKey(card.defense),
		card.lifeOrIntellect
			? `${card.lifeOrIntellect.label}:${card.lifeOrIntellect.value}`
			: "na",
		sortedJoin([...card.subtypes, ...card.keywords]),
		String(card.earliestSetIndex),
	].join("::");
}
