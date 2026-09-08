import {
	PACK_HEIGHT,
	PACK_SEAL_HEIGHT,
} from "@fabkit/apps/pack-opener/config/scene";
import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { ClampToEdgeWrapping, type Texture } from "three";

/** The seal strip's share of the pack image's height, and what's left for
 * the body — see PackMesh.tsx's own PACK_SEAL_HEIGHT/PACK_HEIGHT geometry.
 * Deriving these from the same constants the mesh geometry uses (rather
 * than hardcoding 0.08/0.92) means the art can't shear at the tear line if
 * those dimensions ever change. */
const SEAL_FRACTION = PACK_SEAL_HEIGHT / PACK_HEIGHT;
const BODY_FRACTION = 1 - SEAL_FRACTION;

/**
 * Splits one uploaded pack-front image (see the execution plan, section
 * 5.3 and 7.1 — one 512x1024 WebP per artwork, the seal strip is the top
 * PACK_SEAL_HEIGHT fraction of it) into the body and seal textures via
 * `offset`/`repeat` on two independent clones of the same loaded texture.
 *
 * drei's useTexture() caches by URL — calling it here and in the seal's
 * own hook both return the *same* cached Texture instance, so mutating
 * its offset/repeat directly would make the body and seal overwrite each
 * other's strip (and the mutation would leak into the cache for every
 * other consumer of that URL). Cloning first avoids that; a clone shares
 * the source image/GPU upload, so this doesn't re-fetch or re-upload
 * anything, it just gets its own offset/repeat/wrap state.
 */
function useTextureStrip(
	url: string,
	repeatY: number,
	offsetY: number,
): Texture {
	const source = useTexture(url);
	return useMemo(() => {
		const strip = source.clone();
		strip.wrapS = ClampToEdgeWrapping;
		strip.wrapT = ClampToEdgeWrapping;
		strip.repeat.set(1, repeatY);
		strip.offset.set(0, offsetY);
		strip.needsUpdate = true;
		return strip;
	}, [source, repeatY, offsetY]);
}

/** The bottom BODY_FRACTION of the image (offset 0). */
export function useRealPackBodyTexture(url: string): Texture {
	return useTextureStrip(url, BODY_FRACTION, 0);
}

/** The top SEAL_FRACTION of the image (offset BODY_FRACTION). */
export function useRealPackSealTexture(url: string): Texture {
	return useTextureStrip(url, SEAL_FRACTION, BODY_FRACTION);
}
