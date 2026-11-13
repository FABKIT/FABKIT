import { getMockPackTexture } from "@fabkit/apps/pack-opener/components/scene/textures/mock-pack-texture";
import { getPackArtStrip } from "@fabkit/apps/pack-opener/components/scene/textures/pack-art-strips";
import type { PackPart } from "@fabkit/apps/pack-opener/config/scene";
import { useSafeTexture } from "@fabkit/apps/pack-opener/hooks/useSafeTexture";

interface PackMaterialProps {
	part: PackPart;
	packArtUrl: string | null;
}

/** One strip of the pack's real art, or the plain mock pack when there is none
 * or it failed to load.
 *
 * Unlit: the art is a photograph of a foil pouch, so its highlights are
 * already in the pixels and a lit material would lift the blacks.
 *
 * alphaTest cuts the rounded transparent corners and keeps the material in the
 * opaque queue.
 *
 * Hidden while the art loads rather than left without a map: an invisible
 * material is never compiled, so the map is always there when it first is. */
export function PackMaterial({ part, packArtUrl }: PackMaterialProps) {
	const art = useSafeTexture(packArtUrl);
	const texture =
		art.status === "loaded"
			? getPackArtStrip(art.texture, part)
			: art.status === "error"
				? getMockPackTexture(part)
				: null;

	return (
		<meshBasicMaterial
			map={texture}
			visible={texture !== null}
			alphaTest={0.5}
		/>
	);
}
