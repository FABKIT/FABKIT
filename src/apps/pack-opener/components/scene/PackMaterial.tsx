import { getMockPackTexture } from "@fabkit/apps/pack-opener/components/scene/textures/mock-pack-texture";
import { getPackArtStrip } from "@fabkit/apps/pack-opener/components/scene/textures/pack-art-strips";
import type { PackPart } from "@fabkit/apps/pack-opener/config/scene";
import { useSafeTexture } from "@fabkit/apps/pack-opener/hooks/useSafeTexture";

interface PackMaterialProps {
	part: PackPart;
	packArtUrl: string | null;
}

/** One strip of the pack's real art, or the plain mock pack when there is no
 * art for this set or it failed to load, so a missing image costs the player a
 * wrapper rather than the whole route.
 *
 * Unlit, exactly like the card faces and for the same reason (see "Rendering"
 * in this app's CLAUDE.md): the art is a photograph of a foil pouch, so its
 * sheen, highlights and creases are already in the pixels. A lit material adds
 * a second, computed highlight on top, and because that specular term is
 * additive it lifts the blacks. Most FAB pack fronts are largely black behind
 * the character art, so the whole thing went grey.
 *
 * alphaTest: the art is a cut-out, the pack against transparency with rounded
 * corners. Without it those pixels paint as near-black fringes. A hard cutout
 * also keeps the material in the opaque queue, same reasoning as the cards.
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
