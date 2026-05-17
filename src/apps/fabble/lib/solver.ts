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

/**
 * Detects fingerprint collisions in the pool.
 * A collision means two cards are indistinguishable via the 10-column grid.
 * Called at build time; ambiguous cards are excluded from daily selection.
 */
export function findCollisions(
	pool: CanonicalCard[],
): Array<{ fingerprint: string; names: string[] }> {
	const fingerprintMap = new Map<string, string[]>();

	for (const card of pool) {
		const fp = computeFingerprint(card);
		const existing = fingerprintMap.get(fp) ?? [];
		existing.push(card.name);
		fingerprintMap.set(fp, existing);
	}

	return [...fingerprintMap.entries()]
		.filter(([, names]) => names.length > 1)
		.map(([fingerprint, names]) => ({ fingerprint, names }));
}
