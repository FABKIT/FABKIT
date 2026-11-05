import { preloadSafeTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture";
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
	// Every artwork this set has, not just the one being used now.
	//
	// Since a fresh artwork is rolled on every "Open Another Pack", a set
	// with four pack fronts was a cold fetch three times out of four, no
	// matter how many packs had been opened, and the pack sits blank until
	// its artwork arrives. Warming the set's whole (small, local, 1 to 4 file)
	// collection on selection means the roll is always a cache hit by the time
	// anyone opens anything. Through the same cache PackMaterial.tsx reads, or
	// the artwork would be downloaded twice.
	for (const artUrl of entry.packArt) preloadSafeTexture(artUrl);
	return pickPackArt(entry);
}

function pickPackArt(entry: SetIndexEntry): string | null {
	if (entry.packArt.length === 0) return null;
	const index = Math.floor(Math.random() * entry.packArt.length);
	return entry.packArt[index];
}
