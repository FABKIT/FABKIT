import type { SetIndexEntry } from "@fabkit/shared/data/fab-printings";
import { useEffect } from "react";

/** Warms the logos either side of the current set. Stepping through the
 * carousel is the common way to browse, so the next one a player asks for is
 * almost always one of these two, and fetching them now turns a visible wait
 * into an instant swap. Deliberately only the neighbours: these are
 * full-resolution originals, so preloading all of them would trade one slow
 * logo for a great deal of pointless traffic. */
export function useNeighbourLogoPreload(
	sets: SetIndexEntry[],
	currentPosition: number,
): void {
	useEffect(() => {
		if (sets.length === 0) return;
		for (const offset of [-1, 1]) {
			const neighbour =
				sets[(currentPosition + offset + sets.length) % sets.length];
			if (!neighbour?.setLogo) continue;
			const img = new Image();
			img.decoding = "async";
			img.src = neighbour.setLogo;
		}
	}, [sets, currentPosition]);
}
