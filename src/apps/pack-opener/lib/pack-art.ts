import { preloadSafeTexture } from "@fabkit/apps/pack-opener/lib/texture-cache";
import {
	getSetIndex,
	type SetIndexEntry,
} from "@fabkit/shared/data/fab-printings";

/** Picks a fresh artwork for a set code and starts loading it, or null if
 * the set has none uploaded (or is not in the index yet), in which case
 * PackMesh.tsx falls back to the mock canvas-drawn pack. The single place
 * that turns "which set" into "which pack front", so its callers in the
 * store cannot drift apart.
 *
 * Re-rolled every time the pack opener mounts and every time a set is
 * selected, rather than once and then kept for the session. A set can have
 * several pack fronts (Welcome to Rathe has four, one per hero) and seeing
 * the same one every visit made a set with four artworks look like a set
 * with one. */
export function rollPackArt(setCode: string | null): string | null {
	if (!setCode) return null;
	const entry = getSetIndex().find((set) => set.code === setCode);
	if (!entry) return null;
	// Warms all of a set's artworks, so the roll is always a cache hit.
	for (const artUrl of entry.packArt) preloadSafeTexture(artUrl);
	return pickPackArt(entry);
}

function pickPackArt(entry: SetIndexEntry): string | null {
	if (entry.packArt.length === 0) return null;
	const index = Math.floor(Math.random() * entry.packArt.length);
	return entry.packArt[index];
}
