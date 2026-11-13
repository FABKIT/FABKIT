import type { SetIndexEntry } from "@fabkit/shared/data/fab-printings";

/** Where a player with no usable selection lands: the newest mainline booster.
 * Not simply the index's last entry, because the index lists supplemental
 * products after the booster sets, by name, so its last entry is whichever
 * Mastery Pack sorts last rather than anything recent. */
function defaultSetPosition(sets: SetIndexEntry[]): number {
	for (let i = sets.length - 1; i >= 0; i--) {
		if (sets[i].productKind === "booster-set") return i;
	}
	return sets.length - 1;
}

/** The selected set's place in the index, treating a code the index doesn't
 * know (a stored choice from an older build, say) as no selection at all. */
export function selectedSetPosition(
	sets: SetIndexEntry[],
	selectedSet: string | null,
): number {
	const position = sets.findIndex((set) => set.code === selectedSet);
	return position >= 0 ? position : defaultSetPosition(sets);
}

/** The set `offset` steps from `position`, wrapping at either end. */
export function setAtOffset(
	sets: SetIndexEntry[],
	position: number,
	offset: number,
): SetIndexEntry {
	return sets[(position + offset + sets.length) % sets.length];
}

/** The code `offset` steps from the current set. The one calculation behind the
 * arrow buttons, the arrow keys and swiping, so all three agree on where a step
 * lands. */
export function stepSetCode(
	sets: SetIndexEntry[],
	selectedSet: string | null,
	offset: number,
): string {
	return setAtOffset(sets, selectedSetPosition(sets, selectedSet), offset).code;
}
