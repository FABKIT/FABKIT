import {
	PACK_HEIGHT,
	PACK_SEAL_HEIGHT,
	type PackPart,
} from "@fabkit/apps/pack-opener/config/scene";
import type { Texture } from "three";

/** The seal strip's share of the pack image's height, derived from the same
 * constants as the mesh geometry so the art can't shear at the tear line if
 * those dimensions ever change. */
const SEAL_FRACTION = PACK_SEAL_HEIGHT / PACK_HEIGHT;
const BODY_FRACTION = 1 - SEAL_FRACTION;

const stripsBySource = new WeakMap<Texture, Record<PackPart, Texture>>();

function makeStrip(source: Texture, repeatY: number, offsetY: number): Texture {
	const strip = source.clone();
	strip.repeat.set(1, repeatY);
	strip.offset.set(0, offsetY);
	return strip;
}

/**
 * One pack-front image (512x1024, whose top PACK_SEAL_HEIGHT fraction is the
 * seal) shown as a body strip and a seal strip, through offset and repeat on two
 * clones of the same loaded texture. Clones, because the loaded texture is shared
 * through useSafeTexture's cache and mutating it would make the two strips
 * overwrite each other. A clone shares the source image and its GPU upload.
 *
 * Built once per loaded image rather than per PackMesh mount, which remounts for
 * every pack, and released with the image when the texture cache evicts it.
 */
export function getPackArtStrip(source: Texture, part: PackPart): Texture {
	let strips = stripsBySource.get(source);
	if (!strips) {
		const created = {
			body: makeStrip(source, BODY_FRACTION, 0),
			seal: makeStrip(source, SEAL_FRACTION, BODY_FRACTION),
		};
		source.addEventListener("dispose", () => {
			created.body.dispose();
			created.seal.dispose();
		});
		stripsBySource.set(source, created);
		strips = created;
	}
	return strips[part];
}
